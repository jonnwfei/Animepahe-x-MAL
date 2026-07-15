// @author John Cai
// @date 2024-07-11
import { MAL_CLIENT_ID } from "./config.js";
const PLAY_URL = /^https:\/\/[^/]*animepahe\.[^/]+\/play\//;
const ANIME_URL = /^https:\/\/[^/]*animepahe\.[^/]+\/anime\//;

interface AnimeNameResponse {
  onPlayPage: boolean;
  name?: string;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {
    case "GET_ANIME_NAME":
      handleAnimeNameResponse(sendResponse);
      return true; // Keep the message channel open for sendResponse
    case "FETCH_MAL_DATA":
      fetchMALData(msg.query, sendResponse);
      return true;
    default:
      sendResponse({ error: "Unknown message type" });
      return false;
  }
});

function handleAnimeNameResponse(
  sendResponse: (response: AnimeNameResponse) => void,
) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    // NOT on a play Page or Anime Page
    if (
      !tab?.id ||
      !tab.url ||
      !PLAY_URL.test(tab.url) ||
      !ANIME_URL.test(tab.url)
    ) {
      sendResponse({ onPlayPage: false } satisfies AnimeNameResponse);
      return;
    }

    // On a play page
    chrome.tabs.sendMessage(tab.id, { type: "SCRAPE_ANIME_NAME" }, (res) => {
      sendResponse({
        onPlayPage: true,
        name: res?.name ?? "",
      });
    });
  });
  return true;
}

function fetchMALData(
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

  return true; // Keep the message channel open for sendResponse
}
