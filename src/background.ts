// @author John Cai
// @date 2024-07-11

const PLAY_URL = /^https:\/\/[^/]*animepahe\.[^/]+\/play\//;

interface AnimeNameResponse {
  onPlayPage: boolean;
  name?: string;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "GET_ANIME_NAME") return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    // NOT on a play Page
    if (!tab?.id || !tab.url || !PLAY_URL.test(tab.url)) {
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

  return true; // Keep the message channel open for sendResponse
});
