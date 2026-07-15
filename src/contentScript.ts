// @author John Cai
// @date 2024-07-11

import { MESSAGES } from "./messages";

type Direction = "next" | "prev";

const CONFIG = {
  selectors: { next: ".sequel a", prev: ".prequel a" },
  keys: { next: "x", prev: "z" },
  storageKey: "animePaheNav",
} as const;

// ------------------------------
// Title Scraper classes
// ------------------------------
abstract class PageScraper {
  protected abstract readonly pattern: RegExp;
  protected abstract readonly titleSelector: string;

  matches(path: string): boolean {
    return this.pattern.test(path);
  }

  getTitle(): string | null {
    const el = document.querySelector(this.titleSelector);
    return el?.getAttribute("title") ?? el?.textContent.trim() ?? null;
  }
}

class PlayPageScraper extends PageScraper {
  protected readonly pattern = /\/play\//;
  protected readonly titleSelector = ".theatre-info h1 a";
}

class AnimePageScraper extends PageScraper {
  protected readonly pattern = /\/anime\//;
  protected readonly titleSelector = ".title-wrapper h1 a";
}

class TitleScraper {
  constructor(private readonly scrapers: PageScraper[]) {}
  scrape(path = location.pathname): string {
    return (
      this.scrapers.find((s) => s.matches(path))?.getTitle() ?? document.title
    );
  }
}

// ------------------------------
// Overlay Manager
// ------------------------------

class OverlayManager {
  private static readonly STYLE_ID = "ap-overlay-styles";

  private initStyles() {
    if (document.getElementById(OverlayManager.STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = OverlayManager.STYLE_ID;
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
  }

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
  }
}

// ------------------------------
// Navigation Manager
// ------------------------------

class NavigationManager {
  constructor(private readonly overlay: OverlayManager) {}

  private getElement(dir: Direction): HTMLAnchorElement | null {
    return document.querySelector(
      CONFIG.selectors[dir],
    ) as HTMLAnchorElement | null;
  }

  private hasEpisodeNav(): boolean {
    return this.getElement("next") !== null || this.getElement("prev") !== null;
  }

  trigger(dir: Direction) {
    const element = this.getElement(dir);
    if (element) {
      sessionStorage.setItem(CONFIG.storageKey, `Arrived at ${dir} episode`);
      element.click();
    } else {
      this.overlay.show(`No ${dir} episode found`, true);
    }
  }

  enable(): void {
    if (!this.hasEpisodeNav()) return;
    this.checkFeedback();
    this.bindKeyboardShortcuts();
    this.bindClickListeners();
  }

  private checkFeedback() {
    const msg = sessionStorage.getItem(CONFIG.storageKey);
    if (msg) {
      this.overlay.show(msg);
      sessionStorage.removeItem(CONFIG.storageKey);
    }
  }

  private bindKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (!e.shiftKey) return;

      const key = e.key.toLowerCase();
      if (key === CONFIG.keys.next) this.trigger("next");
      if (key === CONFIG.keys.prev) this.trigger("prev");
    });
  }

  private bindClickListeners() {
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
  }
}

// ------------------------------
// Message Routing
// ------------------------------

class MessageRouter {
  constructor(
    private readonly nav: NavigationManager,
    private readonly scraper: TitleScraper,
  ) {}

  listen(): void {
    chrome.runtime.onMessage.addListener((msg: any, _sender, sendResponse) => {
      switch (msg.type) {
        case MESSAGES.SCRAPE_ANIME_NAME: {
          sendResponse({ name: this.scraper.scrape() });
          break;
        }
        case MESSAGES.NAVIGATE: {
          sendResponse({ success: true });
          this.nav.trigger(msg.direction);
          break;
        }
        default:
          console.warn("Unknown message type received:", msg.type);
          sendResponse({ error: "Unknown message type" });
      }
    });
  }
}

function init() {
  console.log("AnimePahe Navigation Loaded");

  const overlayManager = new OverlayManager();
  const navigationManager = new NavigationManager(overlayManager);
  const scraper = new TitleScraper([
    new PlayPageScraper(),
    new AnimePageScraper(),
  ]);

  navigationManager.enable();
  new MessageRouter(navigationManager, scraper).listen();
}

init();
