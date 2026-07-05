// js/tools/selection.js
import GraphicsLayer from "https://js.arcgis.com/4.29/@arcgis/core/layers/GraphicsLayer.js";
import Draw from "https://js.arcgis.com/4.29/@arcgis/core/views/draw/Draw.js";

export class Selection {
    constructor(view) {
        this.view = view;
        this.activeLayer = null;
        this.highlightHandle = null;

        this._panel = document.getElementById("selectionWidgetPanel");
        this._title = document.getElementById("selectionWidgetTitle");
        
        this._init();
    }

    _init() {
        document.getElementById("closeSelectionWidgetBtn").addEventListener("click", () => this.deactivate());
        document.getElementById("selectByPolygonBtn").addEventListener("click", () => this._startDrawPolygon());
        document.getElementById("selectAllBtn").addEventListener("click", () => this._selectAll());
        document.getElementById("clearSelectionBtn").addEventListener("click", () => this._clearSelection());

        // Maak een graphics layer aan voor de selectie-polygoon en highlights
        this.selectionGraphicsLayer = new GraphicsLayer({
            title: "Selectie Hulplaag",
            listMode: "hide" // Verberg deze laag in de lagenlijst
        });
        this.view.map.add(this.selectionGraphicsLayer);
    }

    activate(layer) {
        if (!layer) return;
        this.activeLayer = layer;
        this._panel.style.display = "block";
        this._title.innerText = `Selecteer uit: ${layer.title}`;
        this._clearSelection(); // Maak vorige selectie leeg als we een nieuwe activeren
    }

    deactivate() {
        this._panel.style.display = "none";
        this.activeLayer = null;
        this._clearSelection();
        if (this.draw) {
            this.draw.reset();
        }
    }

    _startDrawPolygon() {
        this.draw = new Draw({ view: this.view });
        const action = this.draw.create("polygon");
        
        this.view.focus(); // Geef focus aan de kaart
        
        action.on("vertex-add", (evt) => this._createPolygonGraphic(evt.vertices));
        action.on("cursor-update", (evt) => this._createPolygonGraphic(evt.vertices));
        action.on("draw-complete", (evt) => {
            const graphic = this._createPolygonGraphic(evt.vertices);
            this._executeQuery(graphic.geometry);
        });
    }

    _createPolygonGraphic(vertices) {
        this.selectionGraphicsLayer.removeAll();
        const polygon = {
            type: "polygon",
            rings: vertices,
            spatialReference: this.view.spatialReference
        };

        const graphic = {
            geometry: polygon,
            symbol: {
                type: "simple-fill",
                color: [0, 94, 158, 0.1],
                outline: {
                    color: "#005e9e",
                    width: 2
                }
            }
        };
        
        this.selectionGraphicsLayer.add(graphic);
        return graphic;
    }

    async _selectAll() {
        if (!this.activeLayer || this.activeLayer.type !== 'feature') {
            console.warn("Select All kan alleen op een Feature Layer.");
            return;
        }
        
        this._clearSelection();
        
        try {
            const query = this.activeLayer.createQuery();
            query.where = "1=1"; // Selecteer alles
            const featureSet = await this.activeLayer.queryFeatures(query);
            this._highlightFeatures(featureSet.features);
        } catch (error) {
            console.error("Fout bij 'Selecteer Alles':", error);
        }
    }

    _clearSelection() {
        if (this.highlightHandle) {
            this.highlightHandle.remove();
            this.highlightHandle = null;
        }
        this.selectionGraphicsLayer.removeAll();
    }

    async _executeQuery(geometry) {
        if (!this.activeLayer || this.activeLayer.type !== 'feature' || !geometry) return;

        this._clearSelection();
        
        try {
            const query = this.activeLayer.createQuery();
            query.geometry = geometry;
            query.spatialRelationship = "intersects";
            query.returnGeometry = true; 

            const featureSet = await this.activeLayer.queryFeatures(query);
            this._highlightFeatures(featureSet.features);
        } catch(error) {
            console.error("Fout bij het uitvoeren van de selectie-query:", error);
        }
    }

    _highlightFeatures(features) {
        this.view.whenLayerView(this.activeLayer).then(layerView => {
            this.highlightHandle = layerView.highlight(features);
        });
    }
}
