export function buildBeautifulLayerList(view) {
    // 1. Wacht tot de View (het scherm) klaar is
    view.when(() => {
        const panel = document.getElementById("customLayerPanel");
        const listContainer = document.getElementById("customLayerList");
        
        listContainer.innerHTML = "";
        panel.style.display = "block";

        // 2. DE FIX: Wacht tot de WebMap écht al zijn lagen heeft ingeladen
        view.map.when(() => {
            
            // Loop door alle lagen heen
            view.map.layers.forEach((layer) => {
                const itemDiv = document.createElement("div");
                itemDiv.className = "layer-item";

                const label = document.createElement("span");
                label.innerText = layer.title || "Naamloze laag";

                // Maak de knop voor het oogje
                const eyeBtn = document.createElement("button");
                eyeBtn.className = "eye-btn";
                
                // Functie om het juiste icoon in te stellen
                const updateIcon = () => {
                    if (layer.visible) {
                        // Open oog (Blauw)
                        eyeBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
                        eyeBtn.style.color = "#005e9e"; 
                    } else {
                        // Gesloten oog met streep erdoor (Grijs)
                        eyeBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
                        eyeBtn.style.color = "#999"; 
                    }
                };

                // Zet het icoon direct goed bij het inladen
                updateIcon();

                // Wat er gebeurt als je op het oogje klikt
                eyeBtn.addEventListener("click", () => {
                    layer.visible = !layer.visible; // Draai zichtbaarheid om
                    updateIcon(); // Pas het icoon direct aan
                });

                itemDiv.appendChild(label);
                itemDiv.appendChild(eyeBtn);
                
                // Gebruik prepend in plaats van append, zo staat de bovenste laag 
                // in de kaart ook bovenaan in je lijstje (GIS standaard!)
                listContainer.prepend(itemDiv); 
            });
        });
    });
}