// @author John Cai
// @date 2024-07-11

import { MESSAGES } from "./messages";

// Constants for DOM elements
const animeLinkElement = document.getElementById(
  "anime-link",
) as HTMLAnchorElement | null;

const prevButton = document.getElementById(
  "prev-btn",
) as HTMLButtonElement | null;
const nextButton = document.getElementById(
  "next-btn",
) as HTMLButtonElement | null;

// ------------------------------
// INITIALIZATION
// ------------------------------

chrome.runtime.sendMessage({ type: MESSAGES.GET_ANIME_NAME }, (response) => {
  if (!animeLinkElement) return;
  if (response?.onSupportedPage) {
    setAnimeLink(response.name);
  } else {
    noAnimeFound(animeLinkElement);
  }
});

if (prevButton) {
  prevButton.addEventListener("click", () => navigateEpisode("prev"));
}

if (nextButton) {
  nextButton.addEventListener("click", () => navigateEpisode("next"));
}

// ------------------------------
// FUNCTIONS
// ------------------------------

/**
 * Set the anime link based on the provided search query by sending a message to the background script.
 * @param searchQuery - The search query to fetch anime data from MyAnimeList.
 */
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
    { type: MESSAGES.FETCH_MAL_LINK, query: searchQuery },
    (response) => {
      if (response && response.success) {
        const data = response.data;

        if (data && data.data && data.data.length > 0) {
          const anime = data.data[0].node;
          animeLinkElement.textContent = anime.title;
          animeLinkElement.href = `https://myanimelist.net/anime/${anime.id}`;

          fetchAnimeScore(anime.id);
        } else {
          noAnimeFound(animeLinkElement);
        }
      }
    },
  );
}

/**
 * Display a message indicating that no anime was found and disable the link.
 * @param AnimeLinkElement - The anchor element to update with the message.
 */
function noAnimeFound(AnimeLinkElement: HTMLAnchorElement) {
  AnimeLinkElement.textContent = "No anime found";
  AnimeLinkElement.style.color = "#f45b5b48";
  AnimeLinkElement.removeAttribute("href");
}

/**
 * Navigate to the next or previous episode by sending a message to the content script.
 * @param direction - The direction to navigate, either "next" or "prev".
 */
function navigateEpisode(direction: "next" | "prev") {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    if (tab?.id) {
      chrome.tabs.sendMessage(
        tab.id,
        { type: MESSAGES.NAVIGATE, direction },
        () => {
          void chrome.runtime.lastError;
        },
      );
    } else {
      window.close();
    }
  });
}

function fetchAnimeScore(animeId: number) {
  const animeScoreEl = document.getElementById("anime-score");
  if (!animeScoreEl) return;

  chrome.runtime.sendMessage(
    { type: MESSAGES.FETCH_MAL_SCORE, id: animeId },
    (response) => {
      if (chrome.runtime.lastError) {
        animeScoreEl.textContent = "N/A";
        return;
      }
      animeScoreEl.textContent = response?.success
        ? response.score.toString()
        : "N/A";
    },
  );
}
