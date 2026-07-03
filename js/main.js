// Importeer de kaart-functie uit ons eigen map.js bestand
import { initializeMap } from './map.js';

// Start de applicatie
function startApp() {
    console.log("App is aan het opstarten...");
    
    // Initialiseer de kaart in de 'viewDiv' div
    const view = initializeMap("viewDiv");

    view.when(() => {
        console.log("Kaart is succesvol geladen!");
        // HIER komen later de connecties naar je tools
        // Bijv: initializeSketchTool(view);
        // Bijv: initializeStreetview(view);
    }).catch(error => {
        console.error("Fout bij het laden van de kaart: ", error);
    });
}

// Voer de startfunctie uit
startApp();
