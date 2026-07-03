// js/main.js
import { initializeMap } from './map.js';

// Importeer de nieuwe portal tool
import { initializePortalTool } from './tools/portal.js';

function startApp() {
    console.log("App is aan het opstarten...");
    const view = initializeMap("viewDiv");

    view.when(() => {
        console.log("Kaart is succesvol geladen!");
        
        // Start de portaal-tool en geef de kaart-view mee
        initializePortalTool(view);
        
    }).catch(error => {
        console.error("Fout bij het laden van de kaart: ", error);
    });
}

startApp();
