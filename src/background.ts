chrome.tabs.onUpdated.addListener((tabId, tab) => {
  if (tab.url && tab.url.includes("animepahe.")) {
    const queryParams = tab.url.split("play/")[1];
    const urlParams = new URLSearchParams(queryParams);
    console.log("Query Params:", urlParams);

    chrome.tabs.sendMessage(tabId, {
      type: "ANIMEPAHE_QUERY_PARAMS",
      videoId: urlParams.get("/"),
    });
  }
});
