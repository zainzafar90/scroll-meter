# Scroll Meter

**See how far you *really* scroll — as real-world distance.**

Scroll Meter is a Chrome extension that turns the pixels you scroll on your feeds
into something you can actually feel: **floors climbed** and absurd landmark
comparisons ("that's 3.4 Eiffel Towers 🗼"). It lives in a small glass
Dynamic-Island–style pill in the corner of the page, and every scroll session
rolls up into a shareable **Scroll Wrapped** card.

## Launch video

https://github.com/zainzafar90/scroll-meter/media/scroll-meter-promo.mp4

<!--
  GitHub only inline-plays videos served from its own asset CDN, not from a
  relative repo path. To get an inline player above:
    1. Open an issue or a release on GitHub, drag media/scroll-meter-promo.mp4
       into the text box, and copy the generated user-attachments URL.
    2. Replace the URL on the line above with that link.
  Until then, the file is tracked in-repo at media/scroll-meter-promo.mp4.
-->

▶ **[Watch the launch video](media/scroll-meter-promo.mp4)** (`media/scroll-meter-promo.mp4`)

## What it does

- **Counts scroll as floors, not pixels.** A mile of scrolling is a clean 500
  floors (~3.22 m per storey). Floors read unambiguously on a feed — no "m"
  that could mean minutes or millions.
- **Absurd landmark comparisons.** Your distance is rendered against real
  landmarks that scale with how far you've gone — a blue whale 🐋, the Statue of
  Liberty 🗽, the Eiffel Tower 🗼, the Burj Khalifa 🏙️, all the way up to a
  marathon 🏃 on multi-mile days.
- **A glass Dynamic-Island pill.** An edge-lit glass pill sits in the corner of
  supported feeds, follows your OS light/dark theme, and glows warmer as you
  approach your daily goal.
- **Snark tiers (optional).** Cross half your goal and it nudges *"you good? 👀"*;
  blow past it and you get *"touch grass 🌱"*.
- **Scroll Wrapped card.** The popup rolls your day up into a shareable card —
  distance, top sites (with their native favicons), a goal ring, and your streak
  — exportable to PNG.
- **Daily goal + streaks.** Set a daily scroll goal; keep the streak alive by
  *staying under* it.

Everything runs and stores **locally**. No accounts, no servers, no analytics.

## Supported sites

The pill appears on the feeds where infinite scroll actually hurts:

X / Twitter · Instagram · Facebook · Reddit · TikTok · YouTube · LinkedIn ·
Threads · Bluesky

## How it works

The content script measures scroll delta in CSS pixels and converts it to
physical distance using screen DPI assumptions (96 px/in), then to floors and
landmark multiples:

```
pixels ──▶ miles / km ──▶ metres ──▶ floors  &  landmark comparison
```

- `lib/distance.ts` — pixel → distance → floors math
- `lib/landmarks.ts` — the ordered landmark table and comparison formatting
- `lib/tracker.ts` — debounced scroll accumulation in the content script
- `lib/tiers.ts` / `lib/streak.ts` — goal tiers, snark, and streak logic
- `lib/storage.ts` / `lib/queue.ts` — per-day aggregation with a recovering
  write queue
- `components/Pill.tsx` — the shadow-DOM glass pill
- `components/WrappedCard.tsx` — the Scroll Wrapped card

## Tech stack

- [WXT](https://wxt.dev) — the extension framework (Chrome MV3)
- React 19 + Tailwind CSS v4
- Vitest for the logic layer
- pnpm for package management

## Getting started

Requires [Node.js](https://nodejs.org) and [pnpm](https://pnpm.io).

```bash
pnpm install
```

### Develop

```bash
pnpm dev            # start WXT in dev mode (Chrome)
pnpm dev:firefox    # Firefox
```

WXT launches a browser with the extension loaded and hot-reloads on change.

### Build

```bash
pnpm build          # production build → .output/chrome-mv3
pnpm zip            # packaged .zip for the Chrome Web Store
```

To load a build manually: open `chrome://extensions`, enable **Developer mode**,
click **Load unpacked**, and select `.output/chrome-mv3`.

### Test & typecheck

```bash
pnpm test           # run the Vitest suite once
pnpm test:watch     # watch mode
pnpm compile        # tsc --noEmit type check
```

## Permissions

Scroll Meter requests only:

- `storage` — to persist your daily totals and settings locally
- `favicon` — to render each site's native favicon on the Wrapped card

It makes no network requests and collects no data.

## Project layout

```
entrypoints/   background, content script, and popup
components/     Pill, WrappedCard, GoalRing, Favicon (+ CSS)
lib/            pure logic (distance, landmarks, tiers, streak, storage) + tests
public/         extension icons
docs/           design spec + manual QA checklist
media/          launch video
```

## License

[MIT](LICENSE) © Zain Zafar
