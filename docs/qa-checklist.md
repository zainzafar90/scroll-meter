# Scroll Meter — Manual QA Checklist

Everything except this checklist is verified by `pnpm test` + `pnpm build`. These items can only be confirmed by a human in a real browser.

**Setup:** `pnpm dev` (launches Chrome with the extension loaded + hot reload). Open a tracked site and scroll a feed.

## Per-site matrix
Sites: `x.com`, `twitter.com`, `instagram.com`, `facebook.com`, `reddit.com`, `tiktok.com`, `youtube.com`, `linkedin.com`, `threads.net`, `bsky.app`

For each site:
- [ ] Pill appears top-center on load (resting compact form, e.g. `🐋 0.0mi`).
- [ ] Scrolling expands it to `you scrolled ···· <unit>` and the number climbs live.
- [ ] Theme matches the site (black pill on dark, white pill on light).
- [ ] Pill **never blocks clicks/scroll** on the page (pointer-events: none).
- [ ] After ~1.5s idle it collapses back to the compact form.

## Tiers & motion
Easiest to force: open the popup → Settings → set **Daily goal (mi)** to `0.05`, then scroll.
- [ ] Value color escalates **calm (mint) → warming (amber) → alarmed (red)**.
- [ ] Alarmed adds the subtle shake + red glow + snark line (`touch grass 🌱`).
- [ ] OS "reduce motion" disables the shake/morph.

## Popup
- [ ] Today's total + comparison + per-site breakdown match what you scrolled.
- [ ] Streak chip appears when under goal.
- [ ] **Reset today** zeroes today's totals.
- [ ] Settings (unit / goal / skin / theme / show pill / snark) apply live to the pill.

## Cross-cutting
- [ ] Terminate the service worker (`chrome://extensions` → service worker → terminate), then scroll → data still persists and the pill keeps counting.
- [ ] Toggle the site's own light/dark mode → pill re-skins (auto theme).
- [ ] No console errors from the content script or background.

## Known v1 simplifications (by design, not bugs)
- The pill shows **this tab's** live total (seeded by today's stored total at load). Multi-tab live sync is deferred; the **popup** always shows the accurate combined total from storage.
- Giant landmark units (Golden Gate and beyond) are intentionally rare — honest pixel→mile math keeps daily numbers modest.
