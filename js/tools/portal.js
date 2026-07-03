import Portal from "https://js.arcgis.com/4.29/@arcgis/core/portal/Portal.js";
import WebMap from "https://js.arcgis.com/4.29/@arcgis/core/WebMap.js";
import OAuthInfo from "https://js.arcgis.com/4.29/@arcgis/core/identity/OAuthInfo.js";
import esriId from "https://js.arcgis.com/4.29/@arcgis/core/identity/IdentityManager.js";

export function initializePortalTool(view) {
    const loginBtn = document.getElementById("loginBtn");
    const portalInput = document.getElementById("portalUrlInput");
    const appIdInput = document.getElementById("appIdInput"); // Nieuw: Koppel het App-ID veld
    const contentPanel = document.getElementById("contentPanel");
    const listContainer = document.getElementById("listContainer");
    const panelTitle = document.getElementById("panelTitle");
    const backBtn = document.getElementById("backBtn");

    let currentPortal = null;
    let userGroups = [];

    loginBtn.addEventListener("click", async () => {
        const portalUrl = portalInput.value.trim();
        const appIdValue = appIdInput.value.trim(); // Haal de ingevulde waarde op

        // Check of beide velden zijn ingevuld
        if (!portalUrl) return alert("Vul een Portaal URL in.");
        if (!appIdValue) return alert("Vul een geldig App-ID in.");

        try {
            loginBtn.innerText = "Inloggen...";

            // Configureer OAuth met de dynamische waarden uit de invoervelden
            const info = new OAuthInfo({
                appId: appIdValue, // Gebruik hier de variabele uit het inputveld
                portalUrl: portalUrl,
                popup: true,
                popupCallbackUrl: "https://jobvdnoort.github.io/openGIS/index.html" // Zorg dat deze klopt!
            });
            esriId.registerOAuthInfos([info]);

            currentPortal = new Portal({
                url: portalUrl,
                authMode: "immediate" 
            });

            await currentPortal.load();
            
            loginBtn.innerText = `Welkom, ${currentPortal.user.username}`;
            loginBtn.disabled = true;
            portalInput.disabled = true;
            appIdInput.disabled = true; // Zet ook het App-ID veld op slot na inloggen

            // We vragen het portaal specifiek om alle groepen van deze gebruiker op te halen
            userGroups = await currentPortal.user.fetchGroups();
            showGroups();

        } catch (error) {
            console.error("Fout bij inloggen:", error);
            alert("Inloggen geannuleerd of mislukt. Controleer je URL en App-ID.");
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
        
        // CRUCIAAL: Geef het portal-object mee, zodat de app weet dat je rechten hebt!
        const newWebMap = new WebMap({
            portalItem: {
                id: webmapId,
                portal: currentPortal 
            }
        });

        view.map = newWebMap;
    }
}
