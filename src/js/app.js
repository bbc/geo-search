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
}

function initSearch() {
    var searchForm = document.getElementById('search-form'),
        searchTermField = document.getElementById('search-query');

    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var searchTerm = searchTermField.value;
        searchRequest(searchTerm);

    });
}

function searchRequest(term) {
    var url = "https://moci6bpkok.execute-api.eu-west-1.amazonaws.com/prod/search-query?results=true&lang=en&group=true&mode=query&location_boost=true&location=50.37153%2C-4.14305&q=";
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

    xhr.open('GET', url + term, true);
    xhr.send();
}

function processResponse(response) {
    console.log(response);
}
