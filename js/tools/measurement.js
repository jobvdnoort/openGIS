import DistanceMeasurement2D from "https://js.arcgis.com/4.29/@arcgis/core/widgets/DistanceMeasurement2D.js";

export function setupMeasurementTool(view) {
    // Knoppen en panelen ophalen
    const toolsToggleBtn = document.getElementById("toolsToggleBtn");
    const toolsMenu = document.getElementById("toolsMenu");
    const measureBtn = document.getElementById("measureBtn");

    const customWidgetPanel = document.getElementById("customWidgetPanel");
    const widgetContainer = document.getElementById("widgetContainer");
    const closeWidgetBtn = document.getElementById("closeWidgetBtn");

    let measurementWidget = null;

    // 1. Open of sluit het Tools menu
    toolsToggleBtn.addEventListener("click", () => {
        toolsMenu.style.display = toolsMenu.style.display === "none" ? "block" : "none";
    });

    // 2. Start meten als je in het menu op "Meten (Afstand)" klikt
    measureBtn.addEventListener("click", () => {
        // Menu weer netjes dichtklappen
        toolsMenu.style.display = "none";

        // Ruim oude metingen op als je de knop per ongeluk twee keer indrukt
        if (measurementWidget) {
            measurementWidget.destroy();
        }

        // Maak het meet-paneel zichtbaar
        customWidgetPanel.style.display = "block";

        // Activeer de ArcGIS Meet-Widget en wijs hem toe aan ONS eigen HTML element (container)
        measurementWidget = new DistanceMeasurement2D({
            view: view,
            unit: "meters",
            container: widgetContainer // De truc waardoor hij er mooi uitziet!
        });

        // Start het tekenen onmiddellijk
        measurementWidget.viewModel.start();
    });

    // 3. Wis alles als je op het kruisje (X) klikt
    closeWidgetBtn.addEventListener("click", () => {
        if (measurementWidget) {
            measurementWidget.viewModel.clear(); // Verwijdert de lijn
            measurementWidget.destroy();         // Ruimt de widget op
            measurementWidget = null;
        }
        // Verberg het paneel weer
        customWidgetPanel.style.display = "none";
    });
}