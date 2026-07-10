const updatesElement = document.getElementById("updates");

chrome.runtime.sendMessage({ type: "GET_ANIME_NAME" }, (response) => {
  if (!updatesElement) return;
  if (response?.onPlayPage) {
    updatesElement.textContent = response.name || "(name not found)";
  } else {
    updatesElement.textContent = "Open an anime episode page to see details.";
  }
});
