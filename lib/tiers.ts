import type { Tier } from "./types";

// Tiers are fractions of the user's daily goal, so "alarmed" coincides with
// breaking the streak (see lib/streak.ts).
export function tier(mi: number, goalMi: number): Tier {
  if (mi < 0.5 * goalMi) return "calm";
  if (mi < 1.0 * goalMi) return "warming";
  return "alarmed";
}

export const SNARK: Record<Tier, string> = {
  calm: "",
  warming: "you good? 👀",
  alarmed: "touch grass 🌱",
};
