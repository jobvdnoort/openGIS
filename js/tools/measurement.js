import DistanceMeasurement2D from "https://js.arcgis.com/4.29/@arcgis/core/widgets/DistanceMeasurement2D.js";

export function setupMeasurementTool(view) {
    const toolsToggleBtn = document.getElementById("toolsToggleBtn");
    const bottomToolbar = document.getElementById("bottomToolbar");
    const measureBtn = document.getElementById("measureBtn");
    const clearMeasureBtn = document.getElementById("clearMeasureBtn");

    let measurementWidget = null;

    // 1. Open of sluit de toolbar als je op 'Tools' klikt
    toolsToggleBtn.addEventListener("click", () => {
        bottomToolbar.style.display = bottomToolbar.style.display === "none" ? "flex" : "none";
    });

    // 2. Start de meting als je op 'Measure' klikt
    measureBtn.addEventListener("click", () => {
        // Zorg dat we niet dubbel tekenen als je vaker op de knop klikt
        if (measurementWidget) {
            measurementWidget.destroy();
        }

        // Activeer de ArcGIS Meet-Widget
        measurementWidget = new DistanceMeasurement2D({
            view: view,
            unit: "meters"
        });

        // Voeg de UI van de widget linksonder toe (zodat hij niet over je Tools-knop valt)
        view.ui.add(measurementWidget, "bottom-left");
        
        // Start het tekenen onmiddellijk
        measurementWidget.viewModel.start();

        // Laat de Clear-knop in jouw toolbar zien
        clearMeasureBtn.style.display = "inline-block";
    });

    // 3. Wis alles als je op 'Clear measurement' klikt
    clearMeasureBtn.addEventListener("click", () => {
        if (measurementWidget) {
            measurementWidget.viewModel.clear(); // Verwijdert de lijn
            view.ui.remove(measurementWidget);   // Verwijdert het venstertje
            measurementWidget.destroy();         // Ruimt het geheugen op
            measurementWidget = null;
        }
        // Verberg de clear-knop weer
        clearMeasureBtn.style.display = "none";
    });
}