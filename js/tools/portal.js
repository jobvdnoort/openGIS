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

    // --- 1. GEHEUGEN OPHALEN ---
    const savedPortalUrl = localStorage.getItem("openGis_portalUrl") || "https://gisportal-test.boskalis.com/portal";
    const savedAppId = localStorage.getItem("openGis_appId") || "";

    portalInput.value = savedPortalUrl;
    if (savedAppId) appIdInput.value = savedAppId;

    // --- 2. AGRESSIEVE AUTO-LOGIN CHECK ---
    // We kijken nu naar de VOLLEDIGE adresbalk, dit kan niet meer missen.
    const currentUrl = window.location.href;
    const hasAuthCode = currentUrl.includes("code=") || currentUrl.includes("access_token=");

    console.log("--- OPEN GIS LOGIN CHECK ---");
    console.log("Opgeslagen App-ID:", savedAppId ? "Aanwezig" : "Leeg");
    console.log("Inlogcode in adresbalk gezien?", hasAuthCode);

    if (savedAppId && savedPortalUrl) {
        // Registreer onmiddellijk!
        const info = new OAuthInfo({
            appId: savedAppId,
            portalUrl: savedPortalUrl,
            popup: false 
        });
        esriId.registerOAuthInfos([info]);

        if (hasAuthCode) {
            console.log("We hebben een redirect-code! Direct inwisselen op de achtergrond...");
            loginBtn.innerText = "Sessie herstellen...";

            // Dit commando scant de URL, pakt de code en logt je direct in!
            esriId.getCredential(savedPortalUrl)
                .then(() => {
                    console.log("Token succesvol bemachtigd! URL opschonen...");
                    // Wis de lange code uit de adresbalk voor een nette applicatie
                    window.history.replaceState({}, document.title, window.location.pathname);
                    loadPortalAndUI(savedPortalUrl);
                })
                .catch(err => {
                    console.error("Fout bij het inwisselen van de URL code:", err);
                    loginBtn.innerText = "Inloggen";
                });
        } else {
            // Geen code in URL, check of we gisteren/eerder al waren ingelogd
            esriId.checkSignInStatus(savedPortalUrl)
                .then(() => {
                    console.log("Bestaande inlogsessie gevonden in geheugen!");
                    loadPortalAndUI(savedPortalUrl);
                })
                .catch(() => {
                    console.log("Geen code in URL en geen bestaande sessie. Gebruiker moet klikken.");
                });
        }
    }

    // --- 3. CENTRALE FUNCTIE: UI OPBOUWEN ---
    async function loadPortalAndUI(portalUrl) {
        try {
            if (!currentPortal) {
                currentPortal = new Portal({ url: portalUrl });
                await currentPortal.load(); 
            }
            
            loginPanel.style.display = "none"; 
            profileWidget.style.display = "block"; 
            userNameDisplay.innerText = currentPortal.user.fullName || currentPortal.user.username;

            userGroups = await currentPortal.user.fetchGroups();
        } catch (error) {
            console.error("Fout bij laden van Portal data:", error);
        }
    }

    // --- 4. HANDMATIG INLOGGEN (BUTTON KLIK) ---
    loginBtn.addEventListener("click", () => {
        const portalUrl = portalInput.value.trim();
        const appIdValue = appIdInput.value.trim();

        if (!portalUrl || !appIdValue) return alert("Vul URL en App-ID in.");

        localStorage.setItem("openGis_portalUrl", portalUrl);
        localStorage.setItem("openGis_appId", appIdValue);

        loginBtn.innerText = "Bezig met doorsturen...";

        const info = new OAuthInfo({
            appId: appIdValue,
            portalUrl: portalUrl,
            popup: false 
        });
        esriId.registerOAuthInfos([info]);

        // Handmatige klik = forceer redirect naar Microsoft
        esriId.getCredential(portalUrl)
            .then(() => loadPortalAndUI(portalUrl))
            .catch((error) => {
                console.error("Inlogprocedure afgebroken:", error);
                loginBtn.innerText = "Inloggen";
            });
    });

    // --- 5. INTERFACE KLIK ACTIES ---
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
        window.location.reload(); 
    });

    // --- 6. WEBMAP KIEZER LOGICA ---
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
