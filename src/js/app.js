var geoSearch = {};

document.addEventListener('DOMContentLoaded', function() {
    init();
});

function init() {
    initMap();
    initSearch();
}

function initMap() {
    var centreOfUk = [54.00366, -2.547855]

    var map = L.map('map').setView(centreOfUk, 6);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
			'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="http://mapbox.com">Mapbox</a>',
		id: 'mapbox.streets'
	}).addTo(map);

    geoSearch.map = map;

    geoSearch.markersLayer = new L.markerClusterGroup();
}

function initSearch() {
    var searchForm = document.getElementById('search-form'),
        searchTermField = document.getElementById('search-query'),
        locationField = document.getElementById('search-location'),
        selectedLocation = document.getElementById('selected-location'),
        useLocationBtn = document.getElementById('use-location-btn');

    locationField.addEventListener('change', function() {
        selectedLocation.innerHTML = this.value;

        var location = geoSearch.locations[this.value];
        var coords = location.split('%2C');
        var latLng = [parseFloat(coords[0]), parseFloat(coords[1])];
        setMapPosition(latLng);
        geoSearch.latLng = latLng;
    });

    function setMapPosition(latLng) {
        geoSearch.map.setView(latLng, 10);
    }

    var locationApiOptions = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    function foundLocation(pos) {
        resetLocationSelection();
        selectedLocation.innerHTML = 'Current location';
        var latLng = [pos.coords.latitude, pos.coords.  longitude];
        setMapPosition(latLng);
        geoSearch.latLng = latLng;
    }

    function notFoundLocation() {
        selectedLocation.innerHTML = '<span style="color:red">Could not find current location :(</span>';
    }

    useLocationBtn.addEventListener('click', function() {
        geoSearch.latLng = null;
        clearSearchResults();
        clearMapMarkers();
        resetLocationSelection();
        selectedLocation.innerHTML = '<i>searching...<i/>';
        navigator.geolocation.getCurrentPosition(foundLocation, notFoundLocation, locationApiOptions);
    });

    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        clearSearchResults();
        clearMapMarkers();
        var searchTerm = searchTermField.value;
        searchRequest(searchTerm);
    });

    geoSearch.resultLinksElement = document.getElementById('result-links');

    geoSearch.resultsHtmlTemplate = _.template('<h4>${title}</h4><p><img src="${imageUri}"/></p><p>${synopsis}</p><p><a href="${url}" target="_blank">View article</a></p>');

    geoSearch.popupTemplate = _.template('${title}<br><a href="#" onclick="javascript:loadDetails(this)" data-title="${title}" data-url="${url}" data-image-uri=${image_uri} data-synopsis=${synopsis}">Details</a>');

    geoSearch.searchUrlTemplate = _.template('https://moci6bpkok.execute-api.eu-west-1.amazonaws.com/prod/search-query?results=true&lang=en&group=true&mode=query&location_boost=true&location_range=15&location=${location}&q=${term}');

    geoSearch.locations = {
        'edinburgh': '55.9533%2C-3.1883',
        'leeds': '53.8008%2C-1.5491',
        'liverpool': '53.4084%2C-2.9916',
        'london': '51.5074%2C-0.1278',
        'salford':'53.48771%2C-2.29042',
        'warwickshire':'52.15058%2C-1.90149'
    }
}

function clearSearchResults() {
    geoSearch.resultLinksElement.innerHTML = '';
}

function clearMapMarkers() {
    geoSearch.markersLayer.clearLayers();
}

function resetLocationSelection() {
    document.getElementById('search-location').value = '';
}

function searchRequest(term) {
    if(term == '' || geoSearch.latLng == null) {
        return;
    }

    var url = geoSearch.searchUrlTemplate({
        'location': geoSearch.latLng,
        'term': term
    });

    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
        var DONE = 4;
        var OK = 200;

        if (xhr.readyState === DONE) {
            if (xhr.status === OK) {
                processResponse(xhr.responseText);
            } else {
                console.log('Error: ' + xhr.status);
            }
        }
    };

    xhr.open('GET', url, true);
    xhr.send();
}

function processResponse(response) {
    var json = JSON.parse(response);
    _.forEach(json.results, function(resultData) {
        processResult(resultData);
    });
}

function processResult(resultData) {
    var result = _.pick(resultData, ['location', 'title', 'published', 'synopsis', 'url', 'image_uri']);
    if(result.location) {
        addMapMarker(result);
    }
    geoSearch.markersLayer.addTo(geoSearch.map);
    geoSearch.map.fitBounds(geoSearch.markersLayer.getBounds());
}

function addMapMarker(result) {
    // coords are suplied as a string in an array
    var coords = result.location[0].split(',');
    var latLng = [parseFloat(coords[0]), parseFloat(coords[1])];
    var marker = L.marker(latLng);
    result.synopsis = result.synopsis.replace(/ /g, "_");

    var popupText = geoSearch.popupTemplate(result);
    marker.bindPopup(popupText);
    geoSearch.markersLayer.addLayer(marker);
}

function loadDetails(detailsLink) {
    clearSearchResults();
    detailsLink.dataset.synopsis = detailsLink.dataset.synopsis.replace(/_/g, " ");
    var fragment = geoSearch.resultsHtmlTemplate(detailsLink.dataset);
    geoSearch.resultLinksElement.insertAdjacentHTML( 'beforeend', fragment);
}
