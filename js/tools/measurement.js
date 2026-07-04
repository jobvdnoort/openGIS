import DistanceMeasurement2D from "https://js.arcgis.com/4.29/@arcgis/core/widgets/DistanceMeasurement2D.js";

export function setupMeasurementTool(view) {
    const toolsToggleBtn = document.getElementById("toolsToggleBtn");
    const toolsMenu = document.getElementById("toolsMenu");
    const measureBtn = document.getElementById("measureBtn");

    const customWidgetPanel = document.getElementById("customWidgetPanel");
    const widgetContainer = document.getElementById("widgetContainer");
    const closeWidgetBtn = document.getElementById("closeWidgetBtn");
    const panelHeader = customWidgetPanel.querySelector(".panel-header");

    let measurementWidget = null;

    // --- SLEEP-FUNCTIE ---
    function makeDraggable(element, dragHandle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        dragHandle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;

            // Als we beginnen met slepen, overschrijf dan de CSS centrering
            if (element.style.transform !== "none") {
                const rect = element.getBoundingClientRect();
                element.style.left = rect.left + "px";
                element.style.top = rect.top + "px";
                element.style.bottom = "auto";
                element.style.transform = "none"; 
            }
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // Activeer het slepen via de titelbalk
    makeDraggable(customWidgetPanel, panelHeader);

    // --- KNOP ACTIES ---
    toolsToggleBtn.addEventListener("click", () => {
        toolsMenu.style.display = toolsMenu.style.display === "none" ? "block" : "none";
    });

    measureBtn.addEventListener("click", () => {
        toolsMenu.style.display = "none";

        if (measurementWidget) {
            measurementWidget.destroy();
        }

        // DE FIX: Maak een vers element aan zodat Esri niets kapot kan maken
        widgetContainer.innerHTML = "<div id='tempEsriContainer'></div>";
        customWidgetPanel.style.display = "block";

        measurementWidget = new DistanceMeasurement2D({
            view: view,
            unit: "meters",
            container: "tempEsriContainer"
        });

        measurementWidget.viewModel.start();
    });

    closeWidgetBtn.addEventListener("click", () => {
        if (measurementWidget) {
            measurementWidget.viewModel.clear(); 
            measurementWidget.destroy();         
            measurementWidget = null;
            widgetContainer.innerHTML = ""; 
        }
        
        customWidgetPanel.style.display = "none";
        
        // Reset het paneel weer naar het midden voor de volgende keer!
        customWidgetPanel.style.top = "";
        customWidgetPanel.style.left = "50%";
        customWidgetPanel.style.bottom = "30px";
        customWidgetPanel.style.transform = "translateX(-50%)";
    });
}