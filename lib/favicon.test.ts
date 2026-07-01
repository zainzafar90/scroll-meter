import { describe, it, expect, beforeEach } from "vitest";
import { browser } from "wxt/browser";
import { faviconUrl } from "./favicon";

describe("faviconUrl", () => {
  beforeEach(() => {
    // fake-browser may not implement getURL; install a deterministic stub.
    (browser.runtime as unknown as { getURL: (p: string) => string }).getURL = (p: string) =>
      `chrome-extension://id${p}`;
  });
  it("builds a native _favicon url with pageUrl + size", () => {
    const url = faviconUrl("x.com", 32);
    expect(url).toContain("/_favicon/?");
    expect(url).toContain("pageUrl=https%3A%2F%2Fx.com");
    expect(url).toContain("size=32");
  });
  it("defaults size to 32", () => {
    expect(faviconUrl("reddit.com")).toContain("size=32");
  });
});
