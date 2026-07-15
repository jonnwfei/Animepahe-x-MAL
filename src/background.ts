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

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class StorageCache {
  constructor(private readonly ttlMs: number) {}

  async get<T>(key: string): Promise<T | null> {
    const record = await chrome.storage.local.get(key);
    const entry = record[key] as CacheEntry<T> | undefined;

    if (!entry) return null;

    if (entry.expiresAt !== 0 && Date.now() > entry.expiresAt) {
      await chrome.storage.local.remove(key);
      return null;
    }

    return entry.value;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: this.ttlMs > 0 ? Date.now() + this.ttlMs : 0,
    };
    await chrome.storage.local.set({ [key]: entry });
  }
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

// ------------------------------
// Handlers for specific message types
// ------------------------------

const DAY = 1000 * 60 * 60 * 24; // 1 day in milliseconds
const linkCache = new StorageCache(30 * DAY);
const scoreCache = new StorageCache(1 * DAY); // Cache scores for 1 days

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
        if (chrome.runtime.lastError || !res) {
          console.warn("No content script:", chrome.runtime.lastError?.message);
          sendResponse({ onSupportedPage: false });
          return;
        }
        sendResponse({
          onSupportedPage: true,
          name: res?.name ?? "",
        });
      },
    );
  });
}

async function handleFetchMALLink(
  searchQuery: string,
  sendResponse: (response: any) => void,
) {
  const key = `mal:link:${searchQuery.toLowerCase().trim()}`;
  try {
    const cached = await linkCache.get<any>(key);
    if (cached) {
      sendResponse({ success: true, data: cached });
      return;
    }
    const url = `https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(searchQuery)}&limit=1`;

    const result = await fetch(url, {
      method: "GET",
      headers: { "X-MAL-CLIENT-ID": MAL_CLIENT_ID },
    });

    if (!result.ok)
      throw new Error(`MAL API responded with status ${result.status}`);
    const data = await result.json();
    console.log("teh data?:", data); // TODO: Remove this debug log in production

    await linkCache.set(key, data);
    sendResponse({ success: true, data });
  } catch (error: any) {
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Fetch the MyAnimeList score for a given anime ID.
 * @param animeId - The MyAnimeList ID of the anime to fetch the score for.
 * @param sendResponse - The callback function to send the response back to the sender.
 */
async function handleFetchMALScore(
  animeId: number,
  sendResponse: (response: any) => void,
) {
  const key = `mal:score:${animeId}`;

  try {
    const cached = await scoreCache.get<number>(key);
    if (cached !== null) {
      sendResponse({ success: true, score: cached, cached: true });
      return;
    }
    const url = `https://api.myanimelist.net/v2/anime/${animeId}?fields=mean`;

    const result = await fetch(url, {
      method: "GET",
      headers: { "X-MAL-CLIENT-ID": MAL_CLIENT_ID },
    });

    if (!result.ok)
      throw new Error(`MAL API responded with status ${result.status}`);
    const data = await result.json();

    await scoreCache.set(key, data.mean);
    sendResponse({ success: true, score: data.mean });
  } catch (error: any) {
    sendResponse({ success: false, error: error.message });
  }
}
