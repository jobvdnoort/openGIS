import Portal from "https://js.arcgis.com/4.29/@arcgis/core/portal/Portal.js";
import WebMap from "https://js.arcgis.com/4.29/@arcgis/core/WebMap.js";
import OAuthInfo from "https://js.arcgis.com/4.29/@arcgis/core/identity/OAuthInfo.js";
import esriId from "https://js.arcgis.com/4.29/@arcgis/core/identity/IdentityManager.js";
import LayerList from "https://js.arcgis.com/4.29/@arcgis/core/widgets/LayerList.js";

export function initializePortalTool(view) {
    // UI Elementen ophalen
    const loginPanel = document.getElementById("loginPanel");
    const loginBtn = document.getElementById("loginBtn");
    const portalInput = document.getElementById("portalUrlInput");
    const appIdInput = document.getElementById("appIdInput");
    
    const profileWidget = document.getElementById("profileWidget");
    const userAvatar = document.getElementById("userAvatar");
    const profileDropdown = document.getElementById("profileDropdown");
    const userNameDisplay = document.getElementById("userNameDisplay");
    const activeMapDisplay = document.getElementById("activeMapDisplay");
    const logoutBtn = document.getElementById("logoutBtn");
    const openWebmapBtn = document.getElementById("openWebmapBtn");

    const webmapModalOverlay = document.getElementById("webmapModalOverlay");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const listContainer = document.getElementById("listContainer");
    const panelTitle = document.getElementById("panelTitle");
    const backBtn = document.getElementById("backBtn");

    let currentPortal = null;
    let userGroups = [];

    // --- INTERFACE KLIK ACTIES ---

    // Avatar bolletje open/dicht
    userAvatar.addEventListener("click", () => {
        profileDropdown.style.display = profileDropdown.style.display === "none" ? "block" : "none";
    });

    // "Open WebMap..." knop in dropdown
    openWebmapBtn.addEventListener("click", () => {
        profileDropdown.style.display = "none"; // sluit dropdown
        webmapModalOverlay.style.display = "block"; // open grote pop-up
        showGroups(); // laad groepen
    });

    // Sluit (X) knop in de pop-up
    closeModalBtn.addEventListener("click", () => {
        webmapModalOverlay.style.display = "none";
    });

    // Log Uit knop
    logoutBtn.addEventListener("click", () => {
        esriId.destroyCredentials(); // Verwijder de Esri tokens
        window.location.reload(); // Herlaad de pagina om de kaart te resetten
    });

    // --- INLOG LOGICA ---

    loginBtn.addEventListener("click", async () => {
        const portalUrl = portalInput.value.trim();
        const appIdValue = appIdInput.value.trim();

        if (!portalUrl || !appIdValue) return alert("Vul URL en App-ID in.");

        try {
            loginBtn.innerText = "Inloggen...";

            // 1. Configureer de inloggegevens
            const info = new OAuthInfo({
                appId: appIdValue,
                portalUrl: portalUrl,
                popup: true,
                popupCallbackUrl: "https://jobvdnoort.github.io/openGIS/oauth-callback.html"
            });
            esriId.registerOAuthInfos([info]);

            // 2. Forceer de app om expliciet te wachten op het token uit de pop-up
            await esriId.getCredential(portalUrl);

            // 3. Pas áls we de credentials hebben, maken we verbinding met het Portaal
            currentPortal = new Portal({ url: portalUrl });
            await currentPortal.load();
            
            // Inloggen gelukt! Menu ombouwen:
            loginPanel.style.display = "none"; 
            profileWidget.style.display = "block"; 
            userNameDisplay.innerText = currentPortal.user.fullName || currentPortal.user.username;

            userGroups = await currentPortal.user.fetchGroups();

        } catch (error) {
            console.error("Fout bij inloggen of ophalen token:", error);
            alert("Inloggen geannuleerd of mislukt.");
            loginBtn.innerText = "Inloggen";
        }
    }); // <-- HIER STOND HET FOUTJE, DE EVENT LISTENER IS NU NETJES GESLOTEN!

    // --- WEBMAP KIEZER LOGICA ---

    function showGroups() {
        panelTitle.innerText = "Mijn Groepen";
        backBtn.style.display = "none";
        listContainer.innerHTML = ""; 

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
        backBtn.onclick = showGroups; 

        try {
            const result = await group.queryItems({ query: `type:"Web Map"`, num: 20 });
            panelTitle.innerText = `Kaarten in: ${group.title}`;

            if (result.results.length === 0) {
                listContainer.innerHTML = "<p>Geen WebMaps in deze groep.</p>";
                return;
            }

            result.results.forEach(item => {
                const div = document.createElement("div");
                div.className = "list-item";
                div.innerHTML = `<strong>${item.title}</strong><br><small style="color:gray;">Eigenaar: ${item.owner}</small>`;
                div.onclick = () => renderWebMap(item.id, item.title); 
                listContainer.appendChild(div);
            });

        } catch (error) {
            console.error("Fout bij ophalen kaarten:", error);
            listContainer.innerHTML = "<p>Fout bij laden kaarten.</p>";
        }
    }

    function renderWebMap(webmapId, mapTitle) {
        console.log(`WebMap laden: ${webmapId}`);
        
        // 1. Verberg de Modal Pop-up
        webmapModalOverlay.style.display = "none";
        
        // 2. Update de tekst in het dropdown menu met de nieuwe kaartnaam
        activeMapDisplay.innerText = mapTitle;

        // 3. Laad de nieuwe kaart
        const newWebMap = new WebMap({
            portalItem: { id: webmapId, portal: currentPortal }
        });
        view.map = newWebMap;

        // 4. Voeg de Kaartlagenlijst toe aan de linkerkant
        view.when(() => {
            view.ui.empty("top-left"); 
            const layerList = new LayerList({ view: view });
            view.ui.add(layerList, "top-left");
        });
    }
}
