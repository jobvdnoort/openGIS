// js/main.js
import esriConfig from "https://js.arcgis.com/4.29/@arcgis/core/config.js";
import { initializeMap } from './map.js';

// Importeer de nieuwe portal tools
import { initializePortalTool } from './tools/portal.js';
import { setupMeasurementTool } from "./tools/measurement.js";

// 1. Vertel ArcGIS dat alle widgets in het Nederlands moeten!
esriConfig.locale = "nl";

function startApp() {
    console.log("App is aan het opstarten...");
    const view = initializeMap("viewDiv");

    view.when(() => {
        console.log("Kaart is succesvol geladen!");
        
        // Start de portaal-tool en geef de kaart-view mee
        initializePortalTool(view);
        
        // Activeer de Tools/Measurement knoppen!
        setupMeasurementTool(view);
        
    }).catch(error => {
        console.error("Fout bij het laden van de kaart: ", error);
    });
}

startApp();