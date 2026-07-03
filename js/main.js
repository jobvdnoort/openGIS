// js/main.js

// Importeer de kaart-functie
import { initializeMap } from './map.js';

// Importeer je nieuwe tool uit de 'tools' map
import { initializeLoggerTool } from './tools/logger.js';

function startApp() {
    console.log("App is aan het opstarten...");
    
    // Initialiseer de kaart
    const view = initializeMap("viewDiv");

    // Zodra de kaart klaar is met laden...
    view.when(() => {
        console.log("Kaart is succesvol geladen!");
        
        // Start hier je tools op en geef de kaart (view) mee:
        initializeLoggerTool(view);
        
        // Straks voeg je hier simpelweg dit toe:
        // initializeSketchTool(view);
        // initializeStreetviewTool(view);
        
    }).catch(error => {
        console.error("Fout bij het laden van de kaart: ", error);
    });
}

startApp();
