import { browser } from "wxt/browser";
import { addDays } from "./streak";
import {
  DEFAULT_SETTINGS,
  type DayRecord,
  type HostStats,
  type ScrollPayload,
  type Settings,
} from "./types";

export const SETTINGS_KEY = "sm:settings";
export const dayKey = (k: string): string => `sm:day:${k}`;

export function mergeHost(cur: HostStats | undefined, p: ScrollPayload): HostStats {
  if (!cur) {
    return {
      totalPx: p.totalPx,
      downPx: p.downPx,
      downViewports: p.downViewports,
      maxDepthPx: p.maxDepthPx,
      events: p.events,
      firstSeenAt: p.startedAt,
      lastSeenAt: p.lastSeenAt,
    };
  }
  return {
    totalPx: cur.totalPx + p.totalPx,
    downPx: cur.downPx + p.downPx,
    downViewports: cur.downViewports + p.downViewports,
    maxDepthPx: Math.max(cur.maxDepthPx, p.maxDepthPx),
    events: cur.events + p.events,
    firstSeenAt: Math.min(cur.firstSeenAt, p.startedAt),
    lastSeenAt: Math.max(cur.lastSeenAt, p.lastSeenAt),
  };
}

const emptyDay = (dateKey: string): DayRecord => ({ version: 1, dateKey, hosts: {} });

export async function readDay(dateKey: string): Promise<DayRecord> {
  const key = dayKey(dateKey);
  const got = await browser.storage.local.get(key);
  const val = (got as Record<string, unknown>)[key];
  if (!val || typeof val !== "object") return emptyDay(dateKey);
  const rec = val as DayRecord;
  if (rec.version !== 1 || typeof rec.hosts !== "object") return emptyDay(dateKey);
  return rec;
}

export async function writeDay(rec: DayRecord): Promise<void> {
  await browser.storage.local.set({ [dayKey(rec.dateKey)]: rec });
}

export async function applyPayload(p: ScrollPayload): Promise<void> {
  const day = await readDay(p.dateKey);
  const next: DayRecord = {
    version: 1,
    dateKey: p.dateKey,
    hosts: { ...day.hosts, [p.host]: mergeHost(day.hosts[p.host], p) },
  };
  await writeDay(next);
}

export async function readSettings(): Promise<Settings> {
  const got = await browser.storage.local.get(SETTINGS_KEY);
  const val = (got as Record<string, unknown>)[SETTINGS_KEY];
  if (!val || typeof val !== "object") return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(val as Partial<Settings>), version: 1 };
}

export async function writeSettings(patch: Partial<Settings>): Promise<void> {
  const cur = await readSettings();
  await browser.storage.local.set({ [SETTINGS_KEY]: { ...cur, ...patch, version: 1 } });
}

export async function pruneOldDays(maxAgeDays: number, today: string): Promise<void> {
  const all = (await browser.storage.local.get(null)) as Record<string, unknown>;
  const cutoff = addDays(today, -maxAgeDays);
  const toRemove: string[] = [];
  for (const key of Object.keys(all)) {
    if (!key.startsWith("sm:day:")) continue;
    if (key.slice("sm:day:".length) < cutoff) toRemove.push(key);
  }
  if (toRemove.length) await browser.storage.local.remove(toRemove);
}
