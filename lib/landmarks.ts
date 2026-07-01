export interface Landmark {
  readonly name: string;
  readonly emoji: string;
  readonly metres: number;
  readonly plural?: string;
}

// MUST stay sorted ascending by metres — selection assumes ordered iteration.
export const LANDMARKS: readonly Landmark[] = [
  { name: "blue whale", emoji: "🐋", metres: 30 },
  { name: "Olympic pool", emoji: "🏊", metres: 50 },
  { name: "Statue of Liberty", emoji: "🗽", metres: 93, plural: "Statues of Liberty" },
  { name: "football field", emoji: "🏈", metres: 110 },
  { name: "Eiffel Tower", emoji: "🗼", metres: 330 },
  { name: "Empire State Building", emoji: "🏢", metres: 443 },
  { name: "Burj Khalifa", emoji: "🏙️", metres: 828 },
  // ── below: rare flex, multi-mile days only ──
  { name: "Golden Gate Bridge", emoji: "🌉", metres: 2_737 },
  { name: "5K", emoji: "🏃", metres: 5_000 },
  { name: "Mount Everest", emoji: "🏔️", metres: 8_849 },
  { name: "marathon", emoji: "🏃", metres: 42_195 },
];

export function pickLandmark(metres: number): { landmark: Landmark; multiple: number } {
  let chosen = LANDMARKS[0];
  for (const l of LANDMARKS) {
    if (l.metres <= metres) chosen = l;
    else break;
  }
  return { landmark: chosen, multiple: metres / chosen.metres };
}

export function formatComparison(metres: number): string {
  const { landmark, multiple } = pickLandmark(metres);
  if (Math.abs(multiple - 1) <= 0.1) return `the ${landmark.name} ${landmark.emoji}`;
  const m = Math.round(multiple * 10) / 10;
  const noun = landmark.plural ?? `${landmark.name}s`;
  return `${m} ${noun} ${landmark.emoji}`;
}
