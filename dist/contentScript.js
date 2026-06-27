"use strict";
const SELECTORS = {
    next: ".sequel a",
    prev: ".prequel a",
};
const navElements = {
    next: document.querySelector(SELECTORS.next),
    prev: document.querySelector(SELECTORS.prev),
};
() => {
    let currentAnimeId = "";
    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const { type, videoId } = obj;
        if (type === "ANIMEPAHE_QUERY_PARAMS") {
            console.log("Received videoId:", videoId);
            currentAnimeId = videoId;
        }
    });
};
// --- Initialization ---
console.log("AnimePahe Navigation Loaded");
checkNavigationFeedback();
if (navElements.next) {
    navElements.next.addEventListener("click", () => recordState("next"));
}
if (navElements.prev) {
    navElements.prev.addEventListener("click", () => recordState("prev"));
}
// Listen for Shift + Z / X
document.addEventListener("keydown", (e) => {
    if (!e.shiftKey)
        return;
    const key = e.key.toLowerCase();
    if (key === "x") {
        triggerNavigation("next");
    }
    else if (key === "z") {
        triggerNavigation("prev");
    }
});
/**
 * handles navigation of site to the prev/next episode
 *
 * @param {Direction} dir
 */
function triggerNavigation(dir) {
    const element = navElements[dir];
    if (element) {
        element.click();
    }
    else {
        showOverlay(`No ${dir} episode found`, true);
    }
}
/**
 * Saves the state to sessionStorage so the next page knows what happened.
 */
function recordState(dir) {
    sessionStorage.setItem("animePaheNav", `Arrived at ${dir} episode`);
}
/**
 * Main function that calls the prev/next episode message
 */
function checkNavigationFeedback() {
    const msg = sessionStorage.getItem("animePaheNav");
    if (msg) {
        showOverlay(msg);
        sessionStorage.removeItem("animePaheNav");
    }
}
/**
 * Shows a {text} msg on the current window with a 2500ms delay
 *
 * @param {string} text
 * @param isError defaults to false
 */
function showOverlay(text, isError = false) {
    // Create container
    const overlay = document.createElement("div");
    // CSS Styles for a centered, sleek box
    overlay.style.position = "fixed";
    overlay.style.top = "15%";
    overlay.style.left = "50%";
    overlay.style.transform = "translate(-50%, -50%)";
    overlay.style.padding = "15px 25px";
    overlay.style.background = isError
        ? "rgba(200, 50, 50, 0.9)"
        : "rgba(40, 40, 40, 0.95)";
    overlay.style.color = "#fff";
    overlay.style.fontSize = "18px";
    overlay.style.borderRadius = "8px";
    overlay.style.fontFamily = "Segoe UI, sans-serif";
    overlay.style.fontWeight = "600";
    overlay.style.boxShadow = "0 4px 15px rgba(0,0,0,0.4)";
    overlay.style.zIndex = "10000";
    overlay.style.transition = "opacity 0.5s ease";
    overlay.innerText = text;
    document.body.appendChild(overlay);
    // Fade out and remove
    setTimeout(() => {
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 500); // Wait for fade to finish
    }, 2500);
}
