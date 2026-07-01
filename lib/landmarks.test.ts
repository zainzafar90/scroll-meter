import { describe, it, expect } from "vitest";
import { LANDMARKS, pickLandmark, formatComparison } from "./landmarks";

describe("landmarks", () => {
  it("is sorted strictly ascending by metres", () => {
    for (let i = 1; i < LANDMARKS.length; i++)
      expect(LANDMARKS[i].metres).toBeGreaterThan(LANDMARKS[i - 1].metres);
  });
  it("makes every landmark reachable for some distance", () => {
    for (let i = 0; i < LANDMARKS.length; i++) {
      const d = LANDMARKS[i].metres + 1; // just past this entry, before next
      expect(pickLandmark(d).landmark.name).toBe(LANDMARKS[i].name);
    }
  });
  it("selects the last landmark whose size <= d", () => {
    expect(pickLandmark(829).landmark.name).toBe("Burj Khalifa"); // 828 ≤ 829 < 2737
    expect(pickLandmark(2_800).landmark.name).toBe("Golden Gate Bridge");
  });
  it("floors to the smallest landmark below its size", () => {
    const r = pickLandmark(15);
    expect(r.landmark.name).toBe("blue whale");
    expect(r.multiple).toBeLessThan(1);
  });
  it("formats ~1x as 'the X' and otherwise pluralizes", () => {
    expect(formatComparison(330)).toMatch(/the Eiffel Tower/); // exactly 1× → "the"
    expect(formatComparison(400)).toMatch(/1\.2 Eiffel Towers/); // 400m → 1.21× Eiffel
    expect(formatComparison(105)).toMatch(/Statues of Liberty/); // 105m → 1.13×, explicit plural
    // NB: "2 Eiffel Towers" is unreachable by design — the ladder graduates to
    // Empire State (443m) before Eiffel (330m) reaches 2×. That is correct, not a bug.
  });
});
