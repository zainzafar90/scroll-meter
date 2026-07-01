import { browser } from "wxt/browser";

// Chrome's local favicon cache — served from the browser's own store, no
// network request (requires the "favicon" permission). We only ever ask for
// hosts the user has visited, so they're already cached.
export function faviconUrl(host: string, size: number = 32): string {
  const params = new URLSearchParams({
    pageUrl: `https://${host}`,
    size: String(size),
  });
  // `_favicon/` is served by Chrome (favicon permission) but isn't part of WXT's
  // generated PublicPath union, so widen getURL to accept the runtime path.
  const getURL = browser.runtime.getURL as (path: string) => string;
  return getURL(`/_favicon/?${params.toString()}`);
}
