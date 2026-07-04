import Portal from "https://js.arcgis.com/4.29/@arcgis/core/portal/Portal.js";
import WebMap from "https://js.arcgis.com/4.29/@arcgis/core/WebMap.js";
import OAuthInfo from "https://js.arcgis.com/4.29/@arcgis/core/identity/OAuthInfo.js";
import esriId from "https://js.arcgis.com/4.29/@arcgis/core/identity/IdentityManager.js";
import LayerList from "https://js.arcgis.com/4.29/@arcgis/core/widgets/LayerList.js";

export function initializePortalTool(view) {
    // UI Elementen
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

    // --- GEHEUGEN (Local Storage) CHECK ---
    const savedPortalUrl = localStorage.getItem("openGis_portalUrl") || "https://gisportal-test.boskalis.com/portal";
    const savedAppId = localStorage.getItem("openGis_appId") || "";

    portalInput.value = savedPortalUrl;
    if (savedAppId) appIdInput.value = savedAppId;

    // --- HERBRUIKBARE INLOG FUNCTIE ---
    async function performLogin(portalUrl, appIdValue, isAutoLogin = false) {
        try {
            if (!isAutoLogin) loginBtn.innerText = "Inloggen...";

            // 1. Bouw altijd eerst de OAuthInfo op (essentieel zodat de IdentityManager weet wie de app is)
            const info = new OAuthInfo({
                appId: appIdValue,
                portalUrl: portalUrl,
                popup: false 
            });
            esriId.registerOAuthInfos([info]);

            // 2. Maak verbinding met het Portaal
            currentPortal = new Portal({ url: portalUrl });
            
            if (!isAutoLogin) {
                // Handmatige klik: dwing inloggen en redirect af
                currentPortal.authMode = "immediate";
            } else {
                // Automatische check bij opstarten: kijk geruisloos of we al een token hebben
                currentPortal.authMode = "auto";
            }
            
            // Laad de portal. Als er een token in de URL zit, pakt Esri deze nu automatisch op!
            await currentPortal.load(); 
            
            // 3. Succes! Verberg login scherm, toon profiel
            loginPanel.style.display = "none"; 
            profileWidget.style.display = "block"; 
            userNameDisplay.innerText = currentPortal.user.fullName || currentPortal.user.username;

            userGroups = await currentPortal.user.fetchGroups();

        } catch (error) {
            // Foutafhandeling
            if (!isAutoLogin) {
                console.error("Inloggen handmatig mislukt:", error);
                alert("Inloggen geannuleerd of mislukt. Controleer je URL en App-ID.");
                loginBtn.innerText = "Inloggen";
            } else {
                // Auto-login faalt stil als er (nog) geen token in de URL zit. Dat is prima, dan moet men klikken.
                console.log("Geen actieve inlogsessie of token gevonden in de URL bij opstarten.");
            }
        }
    }

    // --- RECHTSTREEKSE AUTO-LOGIN BIJ OPSTARTEN ---
    // Zodra de pagina laadt, controleren we direct of we een opgeslagen App-ID hebben én of er inlogparameters 
    // (zoals '?code=...' of '#access_token=...') in de URL aanwezig zijn van de redirect.
    const hasOAuthParams = window.location.search.includes("code=") || 
                           window.location.search.includes("oauth") || 
                           window.location.hash.includes("access_token=");

    if (savedAppId && hasOAuthParams) {
        console.log("Inlog-tokens gedetecteerd in URL. Auto-login starten...");
        performLogin(savedPortalUrl, savedAppId, true);
    }

    // --- HANDMATIG INLOGGEN (BUTTON KLIK) ---
    loginBtn.addEventListener("click", () => {
        const portalUrl = portalInput.value.trim();
        const appIdValue = appIdInput.value.trim();

        if (!portalUrl || !appIdValue) return alert("Vul URL en App-ID in.");

        // Sla gegevens lokaal op zodat ze de 'redirect' overleven
        localStorage.setItem("openGis_portalUrl", portalUrl);
        localStorage.setItem("openGis_appId", appIdValue);

        performLogin(portalUrl, appIdValue, false);
    });

    // --- INTERFACE KLIK ACTIES ---
    userAvatar.addEventListener("click", () => {
        profileDropdown.style.display = profileDropdown.style.display === "none" ? "block" : "none";
    });

    openWebmapBtn.addEventListener("click", () => {
        profileDropdown.style.display = "none"; 
        webmapModalOverlay.style.display = "block"; 
        showGroups(); 
    });

    closeModalBtn.addEventListener("click", () => {
        webmapModalOverlay.style.display = "none";
    });

    logoutBtn.addEventListener("click", () => {
        esriId.destroyCredentials(); 
        localStorage.removeItem("openGis_appId"); // Wis het ID bij uitloggen voor een schone lei
        window.location.reload(); 
    });

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
        
        webmapModalOverlay.style.display = "none";
        activeMapDisplay.innerText = mapTitle;

        const newWebMap = new WebMap({
            portalItem: { id: webmapId, portal: currentPortal }
        });
        view.map = newWebMap;

        view.when(() => {
            view.ui.empty("top-left"); 
            const layerList = new LayerList({ view: view });
            view.ui.add(layerList, "top-left");
        });
    }
}
