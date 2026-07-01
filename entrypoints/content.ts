import { defineContentScript } from "wxt/utils/define-content-script";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import { browser } from "wxt/browser";
import "../components/pill.css";
import { mountPill, type PillState, type PillStore } from "../components/Pill";
import { ScrollTracker } from "../lib/tracker";
import { dateKey } from "../lib/streak";
import { SETTINGS_KEY, readDay, readSettings } from "../lib/storage";
import { pillTheme } from "../lib/theme";
import { pxToMiles, pxToMetres } from "../lib/distance";
import { DEFAULT_SETTINGS, type FlushResponse, type Message, type ScrollPayload, type Settings } from "../lib/types";

const MATCHES = [
  "https://*.x.com/*",
  "https://*.twitter.com/*",
  "https://*.instagram.com/*",
  "https://*.facebook.com/*",
  "https://*.reddit.com/*",
  "https://*.tiktok.com/*",
  "https://*.youtube.com/*",
  "https://*.linkedin.com/*",
  "https://*.threads.net/*",
  "https://*.bsky.app/*",
];

function localeUnit(): "mi" | "km" {
  const region = (navigator.language.split("-")[1] ?? "").toUpperCase();
  return ["US", "GB", "LR", "MM"].includes(region) ? "mi" : "km";
}

function systemDark(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default defineContentScript({
  matches: MATCHES,
  runAt: "document_idle",
  cssInjectionMode: "ui",
  async main(ctx) {
    if (window.top !== window) return; // top frame only

    const host = location.hostname;
    const tracker = new ScrollTracker(Date.now());

    // --- mutable state ---
    let today = dateKey(new Date());
    let baseTodayPx = 0; // other-session total for today, read at load / rollover
    let liveTabPx = 0; // this tab's monotonic cumulative (drives the live display)
    let settings: Settings = DEFAULT_SETTINGS;
    let resolvedTheme: "light" | "dark" = "dark";
    let scrolling = false;
    let backlog: ScrollPayload | null = null;

    const cumulativePx = () => baseTodayPx + liveTabPx;
    function makeState(): PillState {
      return {
        enabled: settings.enabled,
        totalMi: pxToMiles(cumulativePx()),
        metres: pxToMetres(cumulativePx()),
        scrolling,
        unit: settings.unit === "auto" ? localeUnit() : settings.unit,
        goalMi: settings.dailyGoalMi,
        theme: pillTheme(settings.theme, resolvedTheme),
        snark: settings.snark,
        position: settings.position,
      };
    }

    // --- store ---
    const listeners = new Set<() => void>();
    let snapshot: PillState = makeState();
    const store: PillStore = {
      get: () => snapshot,
      subscribe(cb) {
        listeners.add(cb);
        return () => listeners.delete(cb);
      },
    };
    function emit() {
      snapshot = makeState();
      listeners.forEach((f) => f());
    }

    async function sumTodayPx(dk: string): Promise<number> {
      const day = await readDay(dk);
      let sum = 0;
      for (const h of Object.values(day.hosts)) sum += h.totalPx;
      return sum;
    }

    // --- initial data ---
    settings = await readSettings();
    resolvedTheme = systemDark();
    baseTodayPx = await sumTodayPx(today);
    emit();

    // --- mount the pill in an isolated shadow root ---
    const ui = await createShadowRootUi(ctx, {
      name: "scroll-meter-pill",
      position: "inline",
      anchor: "body",
      append: "first",
      onMount(container, _shadow, shadowHost) {
        (shadowHost as HTMLElement).style.pointerEvents = "none";
        return mountPill(container, store);
      },
      onRemove(root) {
        root?.unmount();
      },
    });
    ui.mount();

    // --- scrolling activity → compact/expanded ---
    let idleTimer: number | undefined;
    function markScrolling() {
      if (!scrolling) scrolling = true;
      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        scrolling = false;
        emit();
      }, 1800);
    }

    function rolloverIfNeeded() {
      const d = dateKey(new Date());
      if (d === today) return;
      today = d;
      liveTabPx = 0;
      void sumTodayPx(today).then((px) => {
        baseTodayPx = px;
        emit();
      });
    }

    // --- delta plumbing (rAF-batched display) ---
    const elementLastY = new WeakMap<Element, number>();
    const viewportH = () => Math.max(1, window.innerHeight);
    const readRootY = () => Math.max(0, document.scrollingElement?.scrollTop ?? 0);
    let lastRootY = readRootY();
    let rafScheduled = false;

    function scheduleEmit() {
      if (rafScheduled) return;
      rafScheduled = true;
      requestAnimationFrame(() => {
        rafScheduled = false;
        emit();
      });
    }

    function onDelta(dy: number) {
      const dist = Math.abs(dy);
      if (dist < 2) return;
      liveTabPx += dist;
      tracker.recordDelta(dy, viewportH(), Date.now());
      markScrolling();
      rolloverIfNeeded();
      scheduleEmit();
    }

    function onRootScroll() {
      const y = readRootY();
      onDelta(y - lastRootY);
      lastRootY = y;
      tracker.recordDepth(y + viewportH());
    }
    function onElementScroll(e: Event) {
      const target = e.target;
      if (!(target instanceof Element)) return; // skips the document's own scroll (handled above)
      const y = Math.max(0, target.scrollTop);
      const last = elementLastY.get(target) ?? y;
      elementLastY.set(target, y);
      onDelta(y - last);
    }

    window.addEventListener("scroll", onRootScroll, { passive: true });
    document.addEventListener("scroll", onElementScroll, { passive: true, capture: true });

    // --- flush loop (persist to background; display is liveTabPx-driven) ---
    function mergePayloads(a: ScrollPayload, b: ScrollPayload): ScrollPayload {
      return {
        host: b.host,
        dateKey: b.dateKey,
        totalPx: a.totalPx + b.totalPx,
        downPx: a.downPx + b.downPx,
        downViewports: a.downViewports + b.downViewports,
        maxDepthPx: Math.max(a.maxDepthPx, b.maxDepthPx),
        events: a.events + b.events,
        startedAt: Math.min(a.startedAt, b.startedAt),
        lastSeenAt: Math.max(a.lastSeenAt, b.lastSeenAt),
      };
    }

    async function flush() {
      if (!tracker.hasPending() && !backlog) return;
      let payload = tracker.buildPayload(host, today);
      tracker.reset(Date.now());
      if (backlog) {
        payload = mergePayloads(backlog, payload);
        backlog = null;
      }
      if (payload.totalPx === 0 && payload.events === 0) return;
      try {
        const res = (await browser.runtime.sendMessage({
          type: "scroll-flush",
          payload,
        } as Message)) as FlushResponse | undefined;
        if (!res || !res.ok) backlog = payload; // re-queue (at-least-once)
      } catch {
        backlog = payload;
      }
    }

    const flushTimer = window.setInterval(() => void flush(), 2000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") void flush();
    });
    window.addEventListener("pagehide", () => void flush());

    // --- react to settings + site-theme changes ---
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes[SETTINGS_KEY]) return;
      void readSettings().then((s) => {
        settings = s;
        if (settings.theme === "auto") resolvedTheme = systemDark();
        emit();
      });
    });
    // follow the OS light/dark preference while theme is "auto"
    const schemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      const next = systemDark();
      if (settings.theme === "auto" && next !== resolvedTheme) {
        resolvedTheme = next;
        emit();
      }
    };
    schemeMq.addEventListener("change", onScheme);

    ctx.onInvalidated(() => {
      clearInterval(flushTimer);
      schemeMq.removeEventListener("change", onScheme);
      ui.remove();
    });
  },
});
