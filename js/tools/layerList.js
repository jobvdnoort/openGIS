import { showLoader, hideLoader } from "./loader.js";

// Een slotje buiten de functie om te onthouden of we al bezig zijn
let isBuilding = false;

export function buildBeautifulLayerList(view, selectionTool) {
    view.when(() => {
        const panel = document.getElementById("customLayerPanel");
        const listContainer = document.getElementById("customLayerList");
        
        panel.style.display = "block";

        // Functie om alle open menu's te sluiten
        const closeAllMenus = () => {
            document.querySelectorAll('.layer-menu').forEach(menu => {
                menu.style.display = 'none';
            });
        };

        // Klik buiten een menu om het te sluiten
        document.addEventListener('click', (evt) => {
            if (!evt.target.closest('.layer-menu-btn')) {
                closeAllMenus();
            }
        });

        view.map.when(async () => {
            if (isBuilding) return;
            isBuilding = true;
            showLoader();
            
            const tempContainer = document.createElement("div");
            
            async function createLayerNode(layer, parentContainer) {
                if (!layer) return;

                if (layer && typeof layer.load === "function") {
                    try {
                        await layer.load();
                    } catch (error) {
                        console.error(`Fout bij het laden van laag ${layer.title || 'Naamloos'}:`, error);
                    }
                }

                const wrapper = document.createElement("div");
                wrapper.className = "layer-wrapper";
                wrapper.style.position = 'relative'; 

                const itemDiv = document.createElement("div");
                itemDiv.className = "layer-item";

                const titleBox = document.createElement("div");
                titleBox.className = "layer-title-box";
                
                const sublayers = layer.layers || layer.sublayers;
                const hasChildren = sublayers && sublayers.length > 0;
                let chevronBtn;

                if (hasChildren) {
                    chevronBtn = document.createElement("button");
                    chevronBtn.className = "chevron-btn";
                    chevronBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
                    
                    const childrenContainer = document.createElement("div");
                    childrenContainer.className = "sublayers-container";
                    childrenContainer.style.display = "none";

                    chevronBtn.addEventListener("click", () => {
                        const isExpanded = childrenContainer.style.display === "block";
                        childrenContainer.style.display = isExpanded ? "none" : "block";
                        chevronBtn.style.transform = isExpanded ? "rotate(0deg)" : "rotate(90deg)";
                    });

                    titleBox.appendChild(chevronBtn);
                    
                    wrapper.appendChild(itemDiv);
                    wrapper.appendChild(childrenContainer);

                    const subArray = sublayers.toArray ? sublayers.toArray() : sublayers;
                    for (const subLayer of subArray) {
                        await createLayerNode(subLayer, childrenContainer);
                    }

                } else {
                    const spacer = document.createElement("div");
                    spacer.className = "chevron-spacer";
                    titleBox.appendChild(spacer);
                    wrapper.appendChild(itemDiv);
                }

                const label = document.createElement("span");
                label.innerText = layer.title || "Naamloze laag";
                titleBox.appendChild(label);
                
                const controlsDiv = document.createElement('div');
                controlsDiv.style.display = 'flex';
                controlsDiv.style.alignItems = 'center';

                const eyeBtn = document.createElement("button");
                eyeBtn.className = "eye-btn";
                
                const updateIcon = () => {
                    eyeBtn.innerHTML = layer.visible 
                        ? `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
                        : `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
                    eyeBtn.style.color = layer.visible ? "#005e9e" : "#999";
                };
                updateIcon();

                eyeBtn.addEventListener("click", () => {
                    layer.visible = !layer.visible;
                    updateIcon();
                });
                controlsDiv.appendChild(eyeBtn);

                // --- Nieuwe Menu Knop ---
                if (layer.type === 'feature' || layer.type === 'map-image') {
                    const menuBtn = document.createElement('button');
                    menuBtn.className = 'layer-menu-btn';
                    menuBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>`;
                    
                    const layerMenu = document.createElement('div');
                    layerMenu.className = 'layer-menu';
                    layerMenu.style.display = 'none';
                    layerMenu.style.right = '25px'; // Positionering
                    
                    const selectMenuItem = document.createElement('div');
                    selectMenuItem.className = 'layer-menu-item';
                    selectMenuItem.innerHTML = `✏️ Selecteer uit Laag`;
                    
                    selectMenuItem.addEventListener('click', () => {
                        selectionTool.activate(layer);
                        layerMenu.style.display = 'none';
                    });

                    layerMenu.appendChild(selectMenuItem);
                    
                    menuBtn.addEventListener('click', (evt) => {
                        evt.stopPropagation(); 
                        closeAllMenus();
                        layerMenu.style.display = 'block';
                    });
                    
                    controlsDiv.appendChild(menuBtn);
                    wrapper.appendChild(layerMenu);
                }

                itemDiv.appendChild(titleBox);
                itemDiv.appendChild(controlsDiv);
                
                parentContainer.prepend(wrapper);
            }

            const mainLayers = view.map.layers.toArray();
            
            const promises = mainLayers.map(mainLayer => createLayerNode(mainLayer, tempContainer).catch(err => {
                console.error("Fout bij het toevoegen van hoofdlaag:", mainLayer.title, err);
            }));

            await Promise.all(promises);

            listContainer.innerHTML = "";
            listContainer.appendChild(tempContainer);

            hideLoader();
            isBuilding = false;
        });
    });
}