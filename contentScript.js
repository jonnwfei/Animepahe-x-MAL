const SELECTORS = {
    next: ".sequel a",
    prev: ".prequel a",
};
const links = {
    next: getLinkUrl("next"),
    prev: getLinkUrl("prev"),
};
checkNavigationFeedback();
/**
 * get links to the given direction (dir) episode
 *
 * @param {Direction} dir
 * @returns link to prev/next episode
 */
function getLinkUrl(dir) {
    if (dir === "next") {
        const el = document.querySelector(SELECTORS.next);
        return el ? el.href : null;
    }
    else {
        const el = document.querySelector(SELECTORS.prev);
        return el ? el.href : null;
    }
}
// Listen for Shift + Z / X
document.addEventListener("keydown", (e) => {
    if (!e.shiftKey)
        return;
    switch (e.key.toLowerCase()) {
        case "x": // next
            handleNavigation("next");
        case "z": // prev
            handleNavigation("next");
    }
});
/**
 *  handles navigation of site to the prev/next episode
 *
 * @param {Direction} dir
 */
function handleNavigation(dir) {
    const url = links[dir];
    if (url) {
        sessionStorage.setItem("animePaheNav", `Arrived at ${dir} episode`);
        window.location.href = url;
    }
    else {
        showOverlay(`No ${dir} episode found`, true);
    }
}
/**
 * Main function that calls the prev/next episode message
 */
function checkNavigationFeedback() {
    const msg = sessionStorage.getItem("animePageNav");
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
