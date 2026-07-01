export const PX_PER_MILE = 6_082_560; // 63,360 in/mi × 96 px/in
export const PX_PER_KM = 3_779_527.56; // 39,370.0787 in/km × 96
const METRES_PER_MILE = 1609.344;

export const pxToMiles = (px: number): number => px / PX_PER_MILE;
export const pxToKm = (px: number): number => px / PX_PER_KM;
export const pxToMetres = (px: number): number => pxToMiles(px) * METRES_PER_MILE;

// Meters-first: small distances read in metres (alive, climbs quickly), then
// graduate to mi/km once large enough that those units feel meaningful.
export function formatDistance(metres: number, unit: "mi" | "km"): { value: string; unit: string } {
  if (metres < 1000) return { value: String(Math.round(metres)), unit: "m" };
  if (unit === "km") return { value: (metres / 1000).toFixed(2), unit: "km" };
  return { value: (metres / METRES_PER_MILE).toFixed(2), unit: "mi" };
}

export function formatDistanceShort(metres: number, unit: "mi" | "km"): string {
  const d = formatDistance(metres, unit);
  return `${d.value}${d.unit}`;
}

// Floors read unambiguously on a feed (no "m" → minutes/millions confusion) and
// match the vertical nature of scrolling. Defined so a mile is a clean 500
// floors (≈ 3.22 m per storey).
export const METRES_PER_FLOOR = METRES_PER_MILE / 500;
export const metresToFloors = (m: number): number => m / METRES_PER_FLOOR;
export const miToFloors = (mi: number): number => (mi * METRES_PER_MILE) / METRES_PER_FLOOR;
export const floorsToMi = (floors: number): number => (floors * METRES_PER_FLOOR) / METRES_PER_MILE;

export function formatFloors(metres: number): { value: string; unit: string } {
  const n = Math.round(metresToFloors(metres));
  return { value: String(n), unit: n === 1 ? "floor" : "floors" };
}
export function formatFloorsShort(metres: number): string {
  const d = formatFloors(metres);
  return `${d.value} ${d.unit}`;
}
