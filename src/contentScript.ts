// @author John Cai
// @date 2024-07-11

import { MESSAGES } from "./messages";

type Direction = "next" | "prev";

const CONFIG = {
  selectors: {
    next: ".sequel a",
    prev: ".prequel a",
    title: ".theatre-info h1 a",
  },
  keys: {
    next: "x",
    prev: "z",
  },
  storageKey: "animePaheNav",
};

const OverlayManager = {
  initStyles() {
    if (document.getElementById("ap-overlay-styles")) return;

    const style = document.createElement("style");
    style.id = "ap-overlay-styles";
    style.textContent = `
      #ap-overlay {
      position: fixed;
      top: 15%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 15px 25px;
      color: #fff;
      fontSize: 18px;
      borderRadius: 8px;
      fontFamily: 'Segoe UI', sans-serif;
      fontWeight: 600;
      boxShadow: 0 4px 15px rgba(0,0,0,0.4);
      zIndex: 10000;
      transition: opacity 0.5s ease;
    }
      .ap-overlay-success { background: rgba(40, 40, 40, 0.95); }
      .ap-overlay-error { background: rgba(200, 50, 50, 0.9); }
      `;
    document.head.appendChild(style);
  },
  show(text: string, isError = false) {
    this.initStyles();

    const overlay = document.createElement("div");
    overlay.className = `ap-overlay ${isError ? "ap-overlay-error" : "ap-overlay-success"}`;
    overlay.innerText = text;

    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 500);
    }, 2500);
  },
};

const NavigationManager = {
  getElement(dir: Direction): HTMLAnchorElement | null {
    return document.querySelector(
      CONFIG.selectors[dir],
    ) as HTMLAnchorElement | null;
  },
  trigger(dir: Direction) {
    const element = this.getElement(dir);
    if (element) {
      sessionStorage.setItem(CONFIG.storageKey, `Arrived at ${dir} episode`);
      element.click();
    } else {
      OverlayManager.show(`No ${dir} episode found`, true);
    }
  },

  checkFeedback() {
    const msg = sessionStorage.getItem(CONFIG.storageKey);
    if (msg) {
      OverlayManager.show(msg);
      sessionStorage.removeItem(CONFIG.storageKey);
    }
  },

  bindKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (!e.shiftKey) return;

      const key = e.key.toLowerCase();
      if (key === CONFIG.keys.next) this.trigger("next");
      if (key === CONFIG.keys.prev) this.trigger("prev");
    });
  },

  bindClickListeners() {
    const nextBtn = this.getElement("next");
    const prevBtn = this.getElement("prev");

    if (nextBtn)
      nextBtn.addEventListener("click", () =>
        sessionStorage.setItem(CONFIG.storageKey, "Arrived at next episode"),
      );
    if (prevBtn)
      prevBtn.addEventListener("click", () =>
        sessionStorage.setItem(CONFIG.storageKey, "Arrived at prev episode"),
      );
  },
};

function initMessageListener() {
  chrome.runtime.onMessage.addListener((msg: any, _sender, sendResponse) => {
    switch (msg.type) {
      case MESSAGES.SCRAPE_ANIME_NAME:
        const el = document.querySelector(CONFIG.selectors.title);
        if (!el) {
          console.warn("Anime title element not found.");
          return;
        }
        const name = el.getAttribute("title")?.toString() || document.title;
        sendResponse({ name });
        break;
      case MESSAGES.NAVIGATE:
        sendResponse({ success: true });
        NavigationManager.trigger(msg.direction);
        break;
      default:
        console.warn("Unknown message type received:", msg.type);
        sendResponse({ error: "Unknown message type" });
    }
  });
}

function init() {
  console.log("AnimePahe Navigation Loaded");

  NavigationManager.bindKeyboardShortcuts();
  NavigationManager.bindClickListeners();
  NavigationManager.checkFeedback();

  initMessageListener();
}

init();
