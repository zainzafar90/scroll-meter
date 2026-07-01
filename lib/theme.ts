// On "auto" the pill follows the OS light/dark preference (the least-surprising
// default); an explicit light/dark setting overrides it. The glass rim + shadow
// keep the pill legible even when it matches the page's own tone.
export function pillTheme(
  setting: "auto" | "light" | "dark",
  systemTheme: "light" | "dark",
): "light" | "dark" {
  return setting === "auto" ? systemTheme : setting;
}
