// @author John Cai
// @date 2024-07-11
const animeLinkElement = document.getElementById(
  "anime-link",
) as HTMLAnchorElement | null;

function setAnimeLink(searchQuery: string) {
  if (chrome.runtime.lastError) {
    console.warn(
      "Could not connect to background script:",
      chrome.runtime.lastError.message,
    );
    if (animeLinkElement) {
      animeLinkElement.textContent = "Extension reloading, try again.";
      animeLinkElement.style.color = "#f45b5b";
    }
    return;
  }

  if (!animeLinkElement) return;

  animeLinkElement.href = "#";
  animeLinkElement.textContent = "Searching...";

  chrome.runtime.sendMessage(
    { type: "FETCH_MAL_DATA", query: searchQuery },
    (response) => {
      if (response && response.success) {
        const data = response.data;

        if (data && data.data && data.data.length > 0) {
          const anime = data.data[0].node;
          animeLinkElement.textContent = anime.title;
          animeLinkElement.href = `https://myanimelist.net/anime/${anime.id}`;
        } else {
          noAnimeFound(animeLinkElement);
        }
      }
    },
  );
}

chrome.runtime.sendMessage({ type: "GET_ANIME_NAME" }, (response) => {
  if (!animeLinkElement) return;
  if (response?.onPlayPage) {
    setAnimeLink(response.name);
  } else {
    noAnimeFound(animeLinkElement);
  }
});

function noAnimeFound(AnimeLinkElement: HTMLAnchorElement) {
  AnimeLinkElement.textContent = "No anime found";
  AnimeLinkElement.style.color = "#f45b5b48";
  AnimeLinkElement.removeAttribute("href");
}
