//js/tools/logger.js

export function initializeLoggerTool(view) {
    console.log("Logger tool is succesvol gekoppeld aan de kaart!");

    // We luisteren naar een 'click' event op de Esri MapView
    view.on("click", (event) => {
        const lat = event.mapPoint.latitude.toFixed(4);
        const lon = event.mapPoint.longitude.toFixed(4);
        
        console.log(`Je hebt geklikt op coördinaten: Lat ${lat}, Lon ${lon}`);
    });
}
