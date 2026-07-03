// We importeren de benodigde Esri modules direct via hun CDN
import Map from "https://js.arcgis.com/4.29/@arcgis/core/Map.js";
import MapView from "https://js.arcgis.com/4.29/@arcgis/core/views/MapView.js";

export function initializeMap(containerId) {
    // 1. Maak de basiskaart aan (bijv. 'topo-vector', 'satellite', 'streets')
    const map = new Map({
        basemap: "topo-vector" 
    });

    // 2. Koppel de kaart aan de HTML div
    const view = new MapView({
        container: containerId, // De ID uit index.html ('viewDiv')
        map: map,
        zoom: 8,
        center: [5.29, 52.13] // Longitude, Latitude (Centrum van Nederland)
    });

    return view;
}
