// js/tools/portal.js
import Portal from "https://js.arcgis.com/4.29/@arcgis/core/portal/Portal.js";
import PortalQueryParams from "https://js.arcgis.com/4.29/@arcgis/core/portal/PortalQueryParams.js";

export function initializePortalTool(view) {
    const loginBtn = document.getElementById("loginBtn");
    const portalInput = document.getElementById("portalUrlInput");
    const webmapSelect = document.getElementById("webmapSelect");

    loginBtn.addEventListener("click", async () => {
        const portalUrl = portalInput.value.trim();
        if (!portalUrl) return alert("Vul eerst een geldige Portaal URL in.");

        try {
            loginBtn.innerText = "Verbinden...";
            
            // 1. Maak verbinding met het opgegeven portaal
            const portal = new Portal({
                url: portalUrl
            });

            // authMode: "immediate" of "auto" triggert het Esri inlogscherm (OAuth2 Pop-up)
            await portal.load();

            console.log(`Succesvol verbonden met: ${portal.name}`);
            alert(`Ingelogd als: ${portal.user ? portal.user.username : "Anonieme gebruiker"}`);
            
            loginBtn.innerText = "Verbonden!";
            
            // 2. Haal de WebMaps van deze gebruiker/dit portaal op
            fetchUserWebMaps(portal, webmapSelect, view);

        } catch (error) {
            console.error("Inloggen mislukt:", error);
            alert("Kon geen verbinding maken met dit portaal. Controleer de URL of je inloggegevens.");
            loginBtn.innerText = "Verbind met Portaal";
        }
    });
}

// Functie om te zoeken naar WebMaps binnen het portaal
async function fetchUserWebMaps(portal, selectElement, view) {
    // We zoeken naar items van het type "Web Map"
    const queryParams = new PortalQueryParams({
        query: `type:"Web Map"`,
        num: 10 // We halen er eerst maximaal 10 op ter demonstratie
    });

    try {
        // Als de gebruiker is ingelogd, zoeken we binnen hun eigen content/organisatie
        const results = await portal.queryItems(queryParams);
        
        // Maak het dropdown menu leeg (behalve de eerste optie)
        selectElement.innerHTML = '<option value="">-- Kies een WebMap --</option>';

        if (results.results.length === 0) {
            alert("Geen WebMaps gevonden in dit portaal.");
            return;
        }

        // Vul de dropdown met de gevonden kaarten
        results.results.forEach(item => {
            const option = document.createElement("option");
            option.value = item.id; // Het unieke Esri ID van de WebMap
            option.innerText = item.title;
            selectElement.appendChild(option);
        });

        // Toon het dropdown menu op het scherm
        selectElement.style.display = "inline-block";

        // Luister of de gebruiker een kaart kiest uit de lijst
        selectElement.addEventListener("change", (e) => {
            const webmapId = e.target.value;
            if (webmapId) {
                loadWebMapIntoView(webmapId, view);
            }
        });

    } catch (err) {
        console.error("Fout bij ophalen WebMaps:", err);
    }
}

// Functie om de gekozen WebMap daadwerkelijk in te laden in de viewer
import WebMap from "https://js.arcgis.com/4.29/@arcgis/core/WebMap.js";

function loadWebMapIntoView(webmapId, view) {
    console.log(`Laden van WebMap ID: ${webmapId}`);
    
    // Maak een nieuwe WebMap instantie op basis van het ID
    const newWebMap = new WebMap({
        portalItem: {
            id: webmapId
        }
    });

    // Vervang de huidige kaart in de view door de nieuwe WebMap
    view.map = newWebMap;
}
