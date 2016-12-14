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

    geoSearch.markersLayer = new L.LayerGroup();
}

function initSearch() {
    var searchForm = document.getElementById('search-form'),
        searchTermField = document.getElementById('search-query'),
        locationField = document.getElementById('search-location');

    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        clearSearchResults();
        clearMapMarkers();
        var searchTerm = searchTermField.value;
        var location = locationField.value;
        searchRequest(searchTerm, location);
    });

    geoSearch.resultLinksElement = document.getElementById('result-links');

    geoSearch.ResultsHtmlTemplate = _.template(
        '<ul class="list-group"><li class="list-group-item"><p><strong>${ title }</strong></p><p>${ published }</p></li></ul>');

    geoSearch.searchUrlTemplate = _.template('https://moci6bpkok.execute-api.eu-west-1.amazonaws.com/prod/search-query?results=true&lang=en&group=true&mode=query&location_boost=true&location=${location}&q=${term}');

    geoSearch.locations = {
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

function searchRequest(term, location) {
    var url = geoSearch.searchUrlTemplate({
        'location': geoSearch.locations[location],
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
    var result = _.pick(resultData, ['location', 'title', 'published', 'url']);
    if(result.location) {
        addMapMarker(result);
        addResultLink(result);
    }
    geoSearch.markersLayer.addTo(geoSearch.map);
}

function addMapMarker(result) {
    // coords are suplied as a string in an array
    var coords = result.location[0].split(',');
    var latLong = [parseFloat(coords[0]), parseFloat(coords[1])];
    var marker = L.marker(latLong);
    marker.bindPopup(result.title);
    geoSearch.markersLayer.addLayer(marker);
}

function addResultLink(result) {
    var fragment = geoSearch.ResultsHtmlTemplate(result);
    geoSearch.resultLinksElement.insertAdjacentHTML( 'beforeend', fragment);
}