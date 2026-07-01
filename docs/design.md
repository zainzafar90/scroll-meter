# Scroll Meter — Design Spec

**Date:** 2026-06-30
**Status:** Approved for planning
**Surface:** Manifest V3 Chrome extension (desktop web), built on WXT + React + TypeScript.

---

## 1. Overview

Scroll Meter measures how far you scroll on social-media sites and reflects it back as a **real-world distance** — the emotional hook that "500 screens" never delivers. The distance surfaces three ways:

1. A live, on-page **Dynamic-Island-style pill** that ticks up as you scroll, renders the distance as an escalating **absurd real-world comparison** ("1.7 Burj Khalifas 🏙️"), and visually escalates calm → amber → red as the day's total climbs.
2. A **popup** showing today's total, the absurd unit, and a per-site breakdown.
3. A shareable **"Scroll Wrapped"** card (Apple Fitness-share lineage) you can export as a PNG.

The product thesis: convert an invisible habit into a physical distance you'd *notice if you walked it*, make it ambient (you can't escape the pill), and make it shareable (the absurd unit is the screenshot).

### Non-goals (v1)

- The marketing concept art shows the pill over the iPhone Instagram app. **That is aspirational.** A Chrome extension content script runs on **desktop web only**; the deliverable is the pill on `instagram.com` etc. in desktop Chrome.
- No charts, weekly-history UI, limit alerts/notifications, ghost/race mode, or cloud sync in v1 (see §13).

---

## 2. Scope

### In scope (v1)

- Scroll tracking on a fixed list of 10 social domains.
- Live pill with auto theme, motion states, absurd-unit engine, tier escalation, snark.
- Per-day / per-site aggregation in `chrome.storage.local`.
- Popup: today total + per-site breakdown + Wrapped card + PNG share.
- Minimal settings: units (mi/km), daily goal, skin, theme override, enable/disable, snark on/off.

### Out of scope (v1)

- Tracking inside cross-origin **iframes** (only the top frame is tracked and shows the pill).
- History/charts beyond "today."
- Notifications / hard limits.

---

## 3. Locked visual design

All validated in the brainstorming visual companion.

### 3.1 Pill skin — "Island" (primary)

- Glossy black Dynamic-Island pill, coral accent number, dotted leader between label and value.
- **Auto-themes to the host page:** black pill on dark sites, white pill on light sites. Theme is detected from the page (see §9.3), with a manual override in settings.
- **"Hype"** (vibrant gradient) is retained as an optional "loud mode" skin, selectable in settings. Not the default.

### 3.2 Motion & states

| State | Trigger | Appearance |
|-------|---------|------------|
| **Resting / compact** | Not actively scrolling | Collapses to a compact pill: `{emoji} {distance}{unit}` (e.g. `🏢 0.4mi` — the emoji is whichever landmark §6.2 currently selects). **Not** a dot. |
| **Active / expanded** | Scrolling | Expands to `you scrolled ···· {absurd unit} {emoji}`, live-updating. |
| **Tier escalation** | Day's total crosses thresholds | Accent color shifts **calm (mint) → warming (amber) → alarmed (red)**; alarmed adds a subtle periodic shake + red glow + the unit emoji tilts. |
| **Snark** | Tier ≥ warming | A short line escalates: `""` → `"you good? 👀"` → `"touch grass 🌱"`. |

- Morph between compact/expanded animates via `max-width` transition (~380ms, ease-out).
- **Respects `prefers-reduced-motion`**: disables shake and morph, keeps instant state swaps.

### 3.3 Scroll Wrapped card — "A1 · Activity"

- Apple Fitness share-card lineage: true-black `#000`, **move-ring pink** accent (`#fa114f`→`#ff6482`), SF system type with tight tracking, hairline-separated breakdown rows, clean app-identity header (rounded app glyph + wordmark + date).
- The **streak chip sits under the headline** (not in the footer); footer is a centered wordmark (`scrollmeter.app`).
- Content: big distance → absurd comparison → per-site breakdown (top 3) → streak chip.

---

## 4. Architecture

WXT port of the prior vanilla MVP. Three entrypoints + a shared `lib/`.

```
  content script (per matched tab)                 background (service worker)
  ────────────────────────────────                 ──────────────────────────
  • measure scroll deltas            scroll-flush   • validate message (type guards)
  • render pill in Shadow DOM    ───────────────▶   • merge into per-day storage key
  • live total =                                    • serialized, recovering writes
      storage today + local pending  ◀───────────   • reply { ok } / { ok:false, error }
                                       { ok }
            ▲                                                      ▲
            │   storage.onChanged: cross-tab today total,          │
            │   settings (theme/skin/enabled)                      │
            └──────────────── chrome.storage.local ────────────────┘
                                      ▲
                                      │  read today + settings; write "reset today"
                                  popup (React)
```

### 4.1 Data flow

1. Content script accumulates scroll deltas in a local counter and **renders the pill immediately** off `storage today total + local pending` (so the pill shows *today, all sites combined*, live, across tabs).
2. Every ~2s while scrolling (and on `visibilitychange:hidden` / `pagehide`), it flushes a payload to the background.
3. Background validates, merges into the **per-day storage key**, and replies `{ ok }`.
4. On `{ ok }`, content clears the flushed pending; on error/`lastError`, it **re-queues** the payload (at-least-once).
5. `storage.onChanged` notifies all content scripts of the new day total (keeps every tab's pill in sync) and of settings changes (theme/skin/enabled).
6. Popup reads today's key + settings directly for display; "reset today" writes directly.

---

## 5. Data model

### 5.1 Storage keys (per-day, not one blob)

> **Why per-day keys:** the prior MVP read-modify-wrote the *entire* history blob on every 2s flush, and a single failed write poisoned its promise chain forever (see §10.2). Per-day keys make each write small, bound the blast radius, and make retention trivial.

```ts
// Key: `sm:day:${dateKey}`  e.g. "sm:day:2026-06-30"
interface DayRecord {
  readonly version: 1;
  readonly dateKey: string;                       // local YYYY-MM-DD
  readonly hosts: Record<string, HostStats>;      // keyed by hostname
}

interface HostStats {
  readonly totalPx: number;        // |Δ| summed (up + down)
  readonly downPx: number;         // down-only
  readonly downViewports: number;  // down px / viewport height, summed
  readonly maxDepthPx: number;     // high-water scroll depth (max)
  readonly events: number;
  readonly firstSeenAt: number;    // epoch ms — = min(existing, payload.startedAt)
  readonly lastSeenAt: number;     // epoch ms — = max(existing, payload.lastSeenAt)
}

// Key: "sm:settings"
interface Settings {
  readonly version: 1;
  readonly unit: "auto" | "mi" | "km";   // auto → km for metric locales, else mi
  readonly dailyGoalMi: number;          // default 1.0 (streak target + tier scale, §6.3/§7)
  readonly skin: "island" | "hype";      // default "island"
  readonly theme: "auto" | "light" | "dark";  // default "auto"
  readonly enabled: boolean;             // master on/off, default true
  readonly snark: boolean;               // default true
}
```

Retention: on background startup, prune `sm:day:*` keys older than **90 days**.

### 5.2 Message protocol

```ts
interface ScrollPayload {
  readonly host: string;
  readonly dateKey: string;
  readonly totalPx: number;
  readonly downPx: number;
  readonly downViewports: number;
  readonly maxDepthPx: number;
  readonly events: number;
  readonly startedAt: number;   // → HostStats.firstSeenAt (min on merge)
  readonly lastSeenAt: number;  // → HostStats.lastSeenAt  (max on merge)
}
type Message = { readonly type: "scroll-flush"; readonly payload: ScrollPayload };
type FlushResponse = { readonly ok: boolean; readonly error?: string };
```

Background **validates every field at the boundary** (runtime type guards) before trusting a message — payloads come from web pages.

---

## 6. Distance & units

### 6.1 Conversion (honest CSS-pixel math)

A CSS pixel is defined as **1/96 inch**. Therefore:

- `PX_PER_MILE  = 63_360 in/mi × 96 px/in = 6_082_560`
- `PX_PER_KM    = 39_370.0787 in/km × 96 = 3_779_527.56`

`distanceMiles = totalPx / PX_PER_MILE`. Honest math means **modest numbers**: a typical heavy desktop-social day lands around **~0.2–0.5 mi** (≈ Eiffel Tower → Burj Khalifa territory), and only an exceptional day approaches ~1 mi. We ship this honestly — `PX_PER_MILE` is the single calibration constant, and v1 does **not** inflate it. The absurd-unit engine (§6.2) is therefore deliberately **dense in the reachable ~30 m–1 km range**; the giant units (Golden Gate and beyond) are intentionally **rare milestone flexes**, not everyday copy.

### 6.2 Absurd-unit engine

A curated landmark ladder, **sorted ascending by `metres`**. Selection iterates the ordered list and keeps the **last landmark whose `metres ≤ d`** (where `d` = current distance in metres); if `d` is below the smallest, the smallest is used (multiple < 1 is allowed only for that floor case). Render the multiple `m = d / metres`:

- `m` within ±10% of 1.0 → `"the {name} {emoji}"`
- otherwise → `"{m|1dp} {name}s {emoji}"`
- entries that don't pluralize (`5K`, `marathon`) carry an `article` form and render `"a {name}"` / `"{m|1dp} {name}s"` per a per-entry rule.

```ts
// MUST stay sorted ascending by metres — selection assumes ordered iteration.
const LANDMARKS = [
  { name: "blue whale",         emoji: "🐋", metres: 30 },
  { name: "Olympic pool",       emoji: "🏊", metres: 50 },
  { name: "Statue of Liberty",  emoji: "🗽", metres: 93 },
  { name: "football field",     emoji: "🏈", metres: 110 },
  { name: "Eiffel Tower",       emoji: "🗼", metres: 330 },
  { name: "Empire State",       emoji: "🏢", metres: 443 },
  { name: "Burj Khalifa",       emoji: "🏙️", metres: 828 },
  // ── below: rare flex, multi-mile days only ──
  { name: "Golden Gate Bridge", emoji: "🌉", metres: 2_737 },
  { name: "5K",                 emoji: "🏃", metres: 5_000 },
  { name: "Mount Everest",      emoji: "🏔️", metres: 8_849 },
  { name: "marathon",           emoji: "🏃", metres: 42_195 },
];
```

The engine updates continuously, so the comparison graduates as the day grows. For honest usage (§6.1) it lives in the **`blue whale` → `Burj Khalifa`** band (7 well-spaced units), giving real users several fun comparisons per day; everything past Burj Khalifa is a deliberately rare flex. A unit test asserts the array is **sorted ascending** and that **every entry is the selected unit for some `d`** (no dead copy).

**Intentional design note — mixed axes:** the ladder deliberately mixes vertical heights (Eiffel, Everest) with horizontal lengths (pool, 5K, marathon). Scroll is a 1-D magnitude and the *joke* is the absurd cross-comparison to any famous measurable thing; we are not claiming axis consistency. This is a product choice, not an oversight.

### 6.3 Tiers & snark

Tiers are expressed as **fractions of the user's `dailyGoalMi`** (§7), so the **alarmed** tier coincides exactly with breaking the streak:

```ts
// goal = settings.dailyGoalMi (default 1.0)
tier(mi, goal) =
  mi < 0.5 * goal ? "calm" :
  mi < 1.0 * goal ? "warming" : "alarmed";
const SNARK = { calm: "", warming: "you good? 👀", alarmed: "touch grass 🌱" };
```

At the default 1.0 mi goal this reproduces calm `< 0.5`, warming `0.5–1.0`, alarmed `≥ 1.0` mi.

---

## 7. Streak logic

A day **qualifies** for the streak when it had **activity and stayed under goal**: `0 < totalMi < dailyGoalMi` (default goal 1.0 mi). The streak is the count of consecutive qualifying days ending today.

- **Today** counts while still under goal, and the displayed count **decrements live the moment today crosses the goal** (alarmed tier and streak-break coincide, §6.3).
- A **zero-activity day** (no tracked site visited) is **neutral** — it neither extends nor breaks the streak; the streak bridges across it. Rationale: not opening a tracked site shouldn't be punished, but it isn't a "stayed under goal" win either.
- A day with `totalMi ≥ goal` **breaks** the streak.

Displayed as `🔥 {n}-day streak under {goal} {unit}` — the goal is stored canonically in miles (`dailyGoalMi`) and **converted to the active display unit** for the label (e.g. `under 1.6 km`); all tier/streak math stays mile-based internally.

> Open question (§13): "under goal" can still demotivate heavy users; an alternative is a "beat yesterday" improvement streak. v1 ships "under goal," goal user-settable.

---

## 8. Scroll tracking (content script)

Reuses the prior MVP's measurement logic (which was sound):

- Listen to `window` `scroll` (root/viewport) and a capture-phase `document` `scroll` (inner scrollers), guarding `target instanceof Element` so the **root scroll is not double-counted**.
- Track per-element last-Y in a `WeakMap` (no leaks).
- Ignore deltas `< 2px`. Accumulate `totalPx`, `downPx`, `downViewports`, `maxDepthPx`, `events`.
- **Top frame only:** `if (window.top !== window) return;` — no iframe tracking/rendering in v1.
- The **visual pill update is rAF-batched**; the **flush** is a 2s `setTimeout`. Flush also fires on `visibilitychange:hidden` and `pagehide`.
- **Day rollover:** the displayed "today" total and local counter reset when the local `dateKey` changes (checked on each tick/flush).

---

## 9. Pill rendering (content script UI)

### 9.1 Mount

- Use WXT's `createShadowRootUi` (with `@wxt-dev/module-react`) to mount the pill as a **React app inside a Shadow DOM** appended to `document.documentElement`. Shadow DOM isolates styles both directions — host-site CSS can't break the pill; pill CSS can't leak.
- Host container: `position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 2147483647;` and **`pointer-events: none`** so the pill **never intercepts clicks/scroll** meant for the feed.

### 9.2 State source

- The pill subscribes to a small store fed by: (a) the live local counter (this tab's pending deltas) and (b) `storage.onChanged` on `sm:day:${today}` (cross-tab combined total). Displayed total = storage today + local pending.
- Tier, absurd unit, snark, and compact/expanded are derived from total + scroll activity.

### 9.3 Theme detection

`theme: "auto"` resolves by sampling the page, in order:

1. Walk `<body>` then `<html>` and take the first **opaque** computed `background-color` (alpha ≥ 0.5); use its luminance.
2. If both are transparent/near-transparent (the **common case** — many sites paint the background on an inner app root, leaving `<html>` transparent), sample `document.elementFromPoint(viewportCentreX, topInset)` and walk up to the first opaque ancestor's `background-color`.
3. Final fallback: `matchMedia('(prefers-color-scheme: dark)')`.

Re-evaluate on `storage` settings change and on a `MutationObserver` of `<html>`/`<body>` class/attribute (sites toggle theme via classes). This explicitly avoids the "transparent → reads as black → wrong dark skin" flash. `light`/`dark` settings force the skin.

### 9.4 Accessibility

- Pill is informational, non-interactive: `aria-live="polite"` on the value, `role="status"`. `pointer-events: none` guarantees it can't trap focus or block the page.
- `prefers-reduced-motion` disables shake/morph.

---

## 10. Aggregation (background)

### 10.1 Listener

- `chrome.runtime.onMessage.addListener` is registered **synchronously at top level** (MV3 requirement). Returns `true` to keep the channel open for the async `sendResponse`.

### 10.2 Serialized, **recovering** write queue

The prior MVP serialized writes with `queue = queue.then(() => persist(p))` — correct for ordering, but **a single rejected `persist` poisoned the chain permanently** (every later `.then` skipped its callback), silently halting all persistence until the SW restarted.

Fix: a **per-day-key** queue whose chain **recovers** from rejection so one failed write never blocks the next:

```ts
const chains = new Map<string, Promise<void>>();
function enqueue(key: string, work: () => Promise<void>): Promise<void> {
  const prev = chains.get(key) ?? Promise.resolve();
  // run `work` whether prev resolved OR rejected — never poison the chain
  const next = prev.then(work, work);
  chains.set(key, next.catch(() => {}));
  return next; // caller still sees THIS write's success/failure for its response
}
```

Merge maps payload→stored and is additive (`totalPx`, `downPx`, `downViewports`, `events`), `max` for `maxDepthPx`. The renamed time fields map explicitly: `firstSeenAt = min(existing.firstSeenAt, payload.startedAt)` and `lastSeenAt = max(existing.lastSeenAt, payload.lastSeenAt)`.

---

## 11. Popup & Wrapped

- **Popup (React):** header, today's big distance + absurd unit, per-site breakdown bars, the Wrapped card, and a **Share** button. "Reset today" clears today's host stats. Live-updates via `storage.onChanged`.
- **Share → PNG:** render the Wrapped card React node to a PNG via `html-to-image` (`toPng`). Primary action = download; nice-to-have = copy image to clipboard (`navigator.clipboard.write`, feature-detected).
- **Glyph fidelity:** the card uses only **system fonts** (`-apple-system`/`system-ui`) and system emoji, rendered at **2× pixelRatio**, so `html-to-image` output is consistent without embedding webfonts. If a custom display font is ever added it MUST be inlined via `fontEmbedCss` — the card *is* the shareable artifact, so a missing glyph is a ship-blocker.

---

## 12. Permissions & manifest (WXT-generated)

- `permissions: ["storage"]`. **No `host_permissions`** — static content scripts are authorized by their `matches`.
- `content_scripts.matches` (10 domains): `*.x.com`, `*.twitter.com`, `*.instagram.com`, `*.facebook.com`, `*.reddit.com`, `*.tiktok.com`, `*.youtube.com`, `*.linkedin.com`, `*.threads.net`, `*.bsky.app` (all `https://…/*`). Chrome's `*.host` matches the bare domain too (verified), so `instagram.com` with no `www` is covered.
- `run_at: document_idle`. `action.default_popup` = the React popup. Add extension icons (the WXT defaults are placeholders).

### File structure (WXT)

```
scroll-meter/
  wxt.config.ts                 # modules: ['@wxt-dev/module-react'], manifest matches/permissions
  entrypoints/
    background.ts               # defineBackground — onMessage, merge, queue, retention
    content.ts                  # defineContentScript — tracking + createShadowRootUi(pill)
    popup/                      # React popup + Wrapped card + share
  components/
    Pill.tsx  WrappedCard.tsx   # shared React UI (pill mounts in shadow root)
  lib/
    types.ts  distance.ts  landmarks.ts  tiers.ts  snark.ts  streak.ts  storage.ts  theme.ts
  assets/  public/icon/
```

---

## 13. Edge cases, risks, open questions

**Edge cases handled:**
- SW unload mid-flush → content `lastError` → re-queue (at-least-once).
- Storage quota → per-day keys + 90-day retention keep the footprint tiny; recovering queue survives a transient failure.
- SPA route changes (X/IG) → single content-script instance, hostname stable, `dateKey` recomputed at flush; pill persists.
- Midnight rollover → today's total + local counter reset on `dateKey` change.
- Click/scroll safety → `pointer-events: none` on the pill host (verified).
- Reduced motion → animations disabled.
- Theme detection on transparent-background sites → opaque-ancestor sampling fallback (§9.3).

**Open questions (resolve in planning or defer):**
1. Streak metric: "under daily goal" vs "beat yesterday." v1 = under-goal (zero-day = neutral, §7), goal user-settable.
2. ~~Default `dailyGoalMi`~~ — **decided: 1.0 mi**, user-settable.
3. Same-origin iframe tracking (v1: top frame only).
4. `unit: "auto"` locale mapping details (assume `navigator.language` region → metric ⇒ km).

---

## 14. Testing strategy

- **Unit (Vitest):**
  - px→mi/km exact constants (`6_082_560`, `3_779_527.56`).
  - **Landmark engine:** array is sorted ascending; every entry is selected for some `d`; boundary selection (e.g. `d = 829 m` → Burj, `d = 2_800 m` → Golden Gate); floor case `d < 30 m`; `≈1.0` → "the {name}".
  - `tier(mi, goal)` boundaries scale with goal.
  - store merge: additive + `max(maxDepthPx)` + `min/max` time mapping.
  - `dateKey` formatting in local time; day-rollover reset.
  - **Write-queue recovery:** a rejected write does NOT block the next; caller still sees its own result.
  - streak: qualify / break / zero-day-neutral / live-decrement across day boundaries.
- **Integration:** content↔background `scroll-flush` round-trip and cross-tab merge using a faked `browser` (e.g. `@webext-core/fake-browser` / WXT test utils).
- **Manual QA matrix:** each of the 10 sites × light/dark — verify tracking sanity, pill theme match, pill never blocks clicks, reduced-motion, popup totals, and PNG export.

---

## 15. Future (v2+)

Weekly/monthly history & charts, daily-limit alerts ("stop after N screens"), ghost/race-against-yesterday, per-site enable/disable UI, more landmark packs & snark voices, optional sync.
