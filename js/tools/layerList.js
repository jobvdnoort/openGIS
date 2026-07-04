import { showLoader, hideLoader } from "./loader.js";

export function buildBeautifulLayerList(view) {
    view.when(() => {
        const panel = document.getElementById("customLayerPanel");
        const listContainer = document.getElementById("customLayerList");
        
        listContainer.innerHTML = "";
        panel.style.display = "block";

        view.map.when(async () => {
            
            // 1. ZET DE SPINNER AAN!
            showLoader();
            
            // Onze recursieve functie om mappenstructuren te bouwen
            async function createLayerNode(layer, parentContainer) {
                if (!layer) return;

                // Alleen .load() aanroepen als de laag deze methode daadwerkelijk heeft (sublayers hebben dit niet!)
                if (layer && typeof layer.load === "function") {
                    try {
                        await layer.load();
                    } catch (error) {
                        console.error(`Fout bij het laden van laag ${layer.title || 'Naamloos'}:`, error);
                    }
                }

                const wrapper = document.createElement("div");
                wrapper.className = "layer-wrapper";

                const itemDiv = document.createElement("div");
                itemDiv.className = "layer-item";

                const titleBox = document.createElement("div");
                titleBox.className = "layer-title-box";

                // Check of de laag kinderen heeft (GroupLayer gebruikt 'layers', MapImageLayer gebruikt 'sublayers')
                const sublayers = layer.layers || layer.sublayers;
                const hasChildren = sublayers && sublayers.length > 0;

                let childrenContainer = null;
                let chevronBtn = null;

                if (hasChildren) {
                    // Maak een uitklap-pijltje
                    chevronBtn = document.createElement("button");
                    chevronBtn.className = "chevron-btn";
                    chevronBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
                    
                    childrenContainer = document.createElement("div");
                    childrenContainer.className = "sublayers-container";
                    childrenContainer.style.display = "none"; // Standaard ingeklapt

                    chevronBtn.addEventListener("click", () => {
                        const isExpanded = childrenContainer.style.display === "block";
                        childrenContainer.style.display = isExpanded ? "none" : "block";
                        chevronBtn.style.transform = isExpanded ? "rotate(0deg)" : "rotate(90deg)";
                    });

                    titleBox.appendChild(chevronBtn);
                } else {
                    // Geen kinderen? Voeg lege ruimte toe voor nette uitlijning van de tekst
                    const spacer = document.createElement("div");
                    spacer.className = "chevron-spacer";
                    titleBox.appendChild(spacer);
                }

                const label = document.createElement("span");
                label.innerText = layer.title || "Naamloze laag";
                titleBox.appendChild(label);

                // --- Oogje ---
                const eyeBtn = document.createElement("button");
                eyeBtn.className = "eye-btn";
                
                const updateIcon = () => {
                    if (layer.visible) {
                        eyeBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
                        eyeBtn.style.color = "#005e9e"; 
                    } else {
                        eyeBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
                        eyeBtn.style.color = "#999"; 
                    }
                };
                updateIcon();

                eyeBtn.addEventListener("click", () => {
                    layer.visible = !layer.visible;
                    updateIcon();
                });

                itemDiv.appendChild(titleBox);
                itemDiv.appendChild(eyeBtn);
                wrapper.appendChild(itemDiv);
                
                // Als er sub-lagen zijn, roep deze functie recursief aan voor de kinderen
                if (hasChildren) {
                    wrapper.appendChild(childrenContainer);
                    const subArray = sublayers.toArray ? sublayers.toArray() : sublayers;
                    for (const subLayer of subArray) {
                        await createLayerNode(subLayer, childrenContainer);
                    }
                }

                // GIS-standaard: zet de bovenste kaartlaag ook bovenaan in je HTML lijst
                parentContainer.prepend(wrapper);
            }

            // Loop door alle hoofdlagen in de WebMap
            const mainLayers = view.map.layers.toArray();
            
            // 2. SNELHEIDSBOOST: We starten het laden voor alle hoofdlagen tegelijk (parallel)
            const promises = mainLayers.map(mainLayer => {
                return createLayerNode(mainLayer, listContainer).catch(err => {
                    console.error("Fout bij het toevoegen van hoofdlaag aan de UI:", mainLayer.title, err);
                });
            });

            // Wacht totdat alle parallelle 'promises' volledig zijn afgerond
            await Promise.all(promises);

            // 3. ZET DE SPINNER WEER UIT!
            hideLoader();
        });
    });
}