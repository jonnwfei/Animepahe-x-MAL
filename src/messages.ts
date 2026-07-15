// @author John Cai
// @date 2026-07-15

export const MESSAGES = {
  GET_ANIME_NAME: "GET_ANIME_NAME",
  SCRAPE_ANIME_NAME: "SCRAPE_ANIME_NAME",
  NAVIGATE: "NAVIGATE",
  FETCH_MAL_LINK: "FETCH_MAL_LINK",
  FETCH_MAL_SCORE: "FETCH_MAL_SCORE",
} as const;

export type MessageType = (typeof MESSAGES)[keyof typeof MESSAGES];
