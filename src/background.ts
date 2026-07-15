// @author John Cai
// @date 2024-07-11
import { MAL_CLIENT_ID } from "./config.js";
import { MESSAGES } from "./messages.js";

const PLAY_URL = /^https:\/\/[^/]*animepahe\.[^/]+\/play\//;
const ANIME_URL = /^https:\/\/[^/]*animepahe\.[^/]+\/anime\//;

interface AnimeNameResponse {
  onSupportedPage: boolean;
  name?: string;
}

// ------------------------------
// Listener for messages from content scripts or popup
// ------------------------------

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {
    case MESSAGES.GET_ANIME_NAME:
      handleAnimeName(sendResponse);
      return true; // Keep the message channel open for sendResponse
    case MESSAGES.FETCH_MAL_LINK:
      handleFetchMALLink(msg.query, sendResponse);
      return true;
    case MESSAGES.FETCH_MAL_SCORE:
      handleFetchMALScore(msg.id, sendResponse);
      return true;
    default:
      sendResponse({ error: "Unknown message type" });
      return false;
  }
});

function handleAnimeName(sendResponse: (response: AnimeNameResponse) => void) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    // NOT on a supported Page (play/anime)
    if (
      !tab?.id ||
      !tab.url ||
      (!PLAY_URL.test(tab.url) && !ANIME_URL.test(tab.url))
    ) {
      sendResponse({ onSupportedPage: false } satisfies AnimeNameResponse);
      return;
    }

    // On a supported Page (play/anime)
    chrome.tabs.sendMessage(
      tab.id,
      { type: MESSAGES.SCRAPE_ANIME_NAME },
      (res) => {
        sendResponse({
          onSupportedPage: true,
          name: res?.name ?? "",
        });
      },
    );
  });
}

function handleFetchMALLink(
  searchQuery: string,
  sendResponse: (response: any) => void,
) {
  const url = `https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(searchQuery)}&limit=1`;

  fetch(url, {
    method: "GET",
    headers: { "X-MAL-CLIENT-ID": MAL_CLIENT_ID },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`MAL API responded with status ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      sendResponse({ success: true, data });
    })
    .catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
}

/**
 * Fetch the MyAnimeList score for a given anime ID.
 * @param animeId - The MyAnimeList ID of the anime to fetch the score for.
 * @param sendResponse - The callback function to send the response back to the sender.
 */
function handleFetchMALScore(
  animeId: number,
  sendResponse: (response: any) => void,
) {
  const url = `https://api.myanimelist.net/v2/anime/${animeId}?fields=mean`;

  fetch(url, {
    method: "GET",
    headers: { "X-MAL-CLIENT-ID": MAL_CLIENT_ID },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`MAL API responded with status ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      sendResponse({ success: true, score: data.mean });
    })
    .catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
}
