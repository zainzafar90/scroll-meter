import { describe, it, expect } from "vitest";
import { pillTheme } from "./theme";

describe("pillTheme", () => {
  it("follows the system theme on auto", () => {
    expect(pillTheme("auto", "dark")).toBe("dark");
    expect(pillTheme("auto", "light")).toBe("light");
  });
  it("honors an explicit setting over the system", () => {
    expect(pillTheme("dark", "light")).toBe("dark");
    expect(pillTheme("light", "dark")).toBe("light");
  });
});
