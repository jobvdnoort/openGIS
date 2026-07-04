// Exporteer de functie zodat we hem ergens anders kunnen gebruiken
export function buildBeautifulLayerList(view) {
    // Wacht tot de view (en de lagen) daadwerkelijk geladen zijn
    view.when(() => {
        const panel = document.getElementById("customLayerPanel");
        const listContainer = document.getElementById("customLayerList");
        
        // Maak de lijst eerst leeg en toon het paneel
        listContainer.innerHTML = "";
        panel.style.display = "block";

        // Loop door alle lagen van de ingeladen WebMap
        view.map.layers.forEach((layer) => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "layer-item";

            // De naam van de laag
            const label = document.createElement("span");
            label.innerText = layer.title || "Naamloze laag";

            // De moderne schakelaar (Toggle)
            const switchLabel = document.createElement("label");
            switchLabel.className = "switch";
            
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            // Zorg dat de switch overeenkomt met of de laag aan/uit staat in de webmap
            checkbox.checked = layer.visible; 

            // Wat er gebeurt als je klikt
            checkbox.addEventListener("change", (e) => {
                layer.visible = e.target.checked;
            });

            const slider = document.createElement("span");
            slider.className = "slider";

            // Voeg alles samen
            switchLabel.appendChild(checkbox);
            switchLabel.appendChild(slider);
            
            itemDiv.appendChild(label);
            itemDiv.appendChild(switchLabel);
            
            listContainer.appendChild(itemDiv);
        });
    });
}
