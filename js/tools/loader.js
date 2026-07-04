// js/tools/loader.js
export function showLoader() {
    const loader = document.getElementById("globalLoader");
    if (loader) loader.style.display = "block";
}

export function hideLoader() {
    const loader = document.getElementById("globalLoader");
    if (loader) loader.style.display = "none";
}