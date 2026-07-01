import { addDays, computeStreak, longestStreak } from "./streak";
import { pxToMiles, pxToMetres } from "./distance";
import type { DayRecord, Settings } from "./types";

const METRES_PER_MILE = 1609.344;

export interface SiteTotal {
  host: string;
  mi: number;
}

export interface HomeData {
  dateKey: string;
  metres: number;
  goalFraction: number;
  streak: number;
  bestStreak: number;
  sites: SiteTotal[];
  week: number[]; // 7 daily metres, oldest → today
  weekTotalMetres: number;
}

function dayPx(rec: DayRecord): number {
  let px = 0;
  for (const h of Object.values(rec.hosts)) px += h.totalPx;
  return px;
}

export function summarizeHome(
  all: Record<string, unknown>,
  today: string,
  settings: Settings,
  topN: number = 4,
): HomeData {
  const pxByDate = new Map<string, number>();
  let todayRec: DayRecord | null = null;

  for (const [key, val] of Object.entries(all)) {
    if (!key.startsWith("sm:day:")) continue;
    const rec = val as DayRecord;
    if (!rec || rec.version !== 1 || typeof rec.hosts !== "object") continue;
    pxByDate.set(rec.dateKey, dayPx(rec));
    if (rec.dateKey === today) todayRec = rec;
  }

  const milesByDate = new Map<string, number>();
  for (const [k, px] of pxByDate) milesByDate.set(k, pxToMiles(px));

  const metres = pxToMetres(pxByDate.get(today) ?? 0);

  const sites: SiteTotal[] = todayRec
    ? Object.entries(todayRec.hosts)
        .map(([h, stats]) => ({ host: h, mi: pxToMiles(stats.totalPx) }))
        .sort((a, b) => b.mi - a.mi)
        .slice(0, topN)
    : [];

  const week: number[] = [];
  for (let i = 6; i >= 0; i--) {
    week.push(pxToMetres(pxByDate.get(addDays(today, -i)) ?? 0));
  }
  const weekTotalMetres = week.reduce((a, b) => a + b, 0);

  const goalMetres = settings.dailyGoalMi * METRES_PER_MILE;

  return {
    dateKey: today,
    metres,
    goalFraction: goalMetres > 0 ? metres / goalMetres : 0,
    streak: computeStreak(milesByDate, today, settings.dailyGoalMi),
    bestStreak: longestStreak(milesByDate, settings.dailyGoalMi),
    sites,
    week,
    weekTotalMetres,
  };
}
