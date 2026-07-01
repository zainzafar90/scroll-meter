import { describe, it, expect } from "vitest";
import { tier, SNARK } from "./tiers";

describe("tiers", () => {
  it("scales thresholds with the goal", () => {
    expect(tier(0.3, 1.0)).toBe("calm");
    expect(tier(0.7, 1.0)).toBe("warming");
    expect(tier(1.1, 1.0)).toBe("alarmed");
    expect(tier(1.1, 2.0)).toBe("warming"); // 1.1 < 0.5*2 .. 1.0*2 ⇒ warming
  });
  it("has snark for warming and alarmed only", () => {
    expect(SNARK.calm).toBe("");
    expect(SNARK.warming.length).toBeGreaterThan(0);
    expect(SNARK.alarmed.length).toBeGreaterThan(0);
  });
});
