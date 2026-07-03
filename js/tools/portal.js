import Portal from "https://js.arcgis.com/4.29/@arcgis/core/portal/Portal.js";
import WebMap from "https://js.arcgis.com/4.29/@arcgis/core/WebMap.js";
import OAuthInfo from "https://js.arcgis.com/4.29/@arcgis/core/identity/OAuthInfo.js";
import esriId from "https://js.arcgis.com/4.29/@arcgis/core/identity/IdentityManager.js";
import LayerList from "https://js.arcgis.com/4.29/@arcgis/core/widgets/LayerList.js";

export function initializePortalTool(view) {
    const loginBtn = document.getElementById("loginBtn");
    const portalInput = document.getElementById("portalUrlInput");
    const appIdInput = document.getElementById("appIdInput");
    const contentPanel = document.getElementById("contentPanel");
    const listContainer = document.getElementById("listContainer");
    const panelTitle = document.getElementById("panelTitle");
    const backBtn = document.getElementById("backBtn");
    
    // Nieuwe elementen
    const portalContent = document.getElementById("portalContent");
    const userAvatar = document.getElementById("userAvatar");

    let currentPortal = null;
    let userGroups = [];

    // Zorg dat we het menu kunnen openen/sluiten met de avatar
    userAvatar.addEventListener("click", () => {
        if (portalContent.style.display === "none") {
            portalContent.style.display = "flex";
        } else {
            portalContent.style.display = "none";
        }
    });

    loginBtn.addEventListener("click", async () => {
        const portalUrl = portalInput.value.trim();
        const appIdValue = appIdInput.value.trim();

        if (!portalUrl || !appIdValue) return alert("Vul URL en App-ID in.");

        try {
            loginBtn.innerText = "Inloggen...";

            const info = new OAuthInfo({
                appId: appIdValue,
                portalUrl: portalUrl,
                popup: true,
                popupCallbackUrl: "https://jobvdnoort.github.io/openGIS/index.html"
            });
            esriId.registerOAuthInfos([info]);

            currentPortal = new Portal({ url: portalUrl, authMode: "immediate" });
            await currentPortal.load();
            
            loginBtn.innerText = `Welkom, ${currentPortal.user.username}`;
            loginBtn.disabled = true;
            portalInput.disabled = true;
            appIdInput.disabled = true;

            // Laat de avatar zien zodra we zijn ingelogd!
            userAvatar.style.display = "block";

            userGroups = await currentPortal.user.fetchGroups();
            showGroups();

        } catch (error) {
            console.error("Fout bij inloggen:", error);
            alert("Inloggen geannuleerd of mislukt.");
            loginBtn.innerText = "Inloggen";
        }
    });

    // --- NAVIGATIE FUNCTIES --- //

    function showGroups() {
        contentPanel.style.display = "block";
        panelTitle.innerText = "Mijn Groepen";
        backBtn.style.display = "none";
        listContainer.innerHTML = ""; // Maak lijst leeg

        if (!userGroups || userGroups.length === 0) {
            listContainer.innerHTML = "<p>Je zit in geen enkele groep.</p>";
            return;
        }

        userGroups.forEach(group => {
            const div = document.createElement("div");
            div.className = "list-item";
            div.innerText = group.title;
            div.onclick = () => loadMapsFromGroup(group);
            listContainer.appendChild(div);
        });
    }

    async function loadMapsFromGroup(group) {
        panelTitle.innerText = `Laden...`;
        listContainer.innerHTML = "";
        backBtn.style.display = "inline-block";
        
        backBtn.onclick = showGroups; // Terugknop actie

        try {
            // Zoek alleen naar WebMaps binnen deze specifieke groep
            const result = await group.queryItems({
                query: `type:"Web Map"`,
                num: 20
            });

            panelTitle.innerText = `Kaarten in: ${group.title}`;

            if (result.results.length === 0) {
                listContainer.innerHTML = "<p>Geen WebMaps in deze groep.</p>";
                return;
            }

            result.results.forEach(item => {
                const div = document.createElement("div");
                div.className = "list-item";
                div.innerHTML = `<strong>${item.title}</strong><br><small style="color:gray;">Eigenaar: ${item.owner}</small>`;
                div.onclick = () => renderWebMap(item.id);
                listContainer.appendChild(div);
            });

        } catch (error) {
            console.error("Fout bij ophalen kaarten:", error);
            listContainer.innerHTML = "<p>Fout bij laden kaarten.</p>";
        }
    }

    function renderWebMap(webmapId) {
        console.log(`WebMap laden: ${webmapId}`);
        
        // 1. Klap het zijpaneel dicht
        portalContent.style.display = "none";

        // 2. Laad de nieuwe kaart
        const newWebMap = new WebMap({
            portalItem: {
                id: webmapId,
                portal: currentPortal 
            }
        });

        view.map = newWebMap;

        // 3. Wacht tot de nieuwe kaart geladen is, voeg dan de Kaartlagenlijst toe aan de linkerkant
        view.when(() => {
            // Haal eventuele oude widgets (van een vorige kaart) weg
            view.ui.empty("top-left"); 
            
            // Maak de nieuwe lagenlijst widget
            const layerList = new LayerList({
                view: view
            });
            
            // Zet hem linksboven, direct onder de Esri zoom-knoppen
            view.ui.add(layerList, "top-left");
        });
    }
} // Einde van initializePortalTool