export type Tier = "calm" | "warming" | "alarmed";

export interface ScrollPayload {
  readonly host: string;
  readonly dateKey: string;
  readonly totalPx: number;
  readonly downPx: number;
  readonly downViewports: number;
  readonly maxDepthPx: number;
  readonly events: number;
  readonly startedAt: number; // → HostStats.firstSeenAt (min)
  readonly lastSeenAt: number; // → HostStats.lastSeenAt  (max)
}
export type Message = { readonly type: "scroll-flush"; readonly payload: ScrollPayload };
export type FlushResponse = { readonly ok: boolean; readonly error?: string };

export interface HostStats {
  readonly totalPx: number;
  readonly downPx: number;
  readonly downViewports: number;
  readonly maxDepthPx: number;
  readonly events: number;
  readonly firstSeenAt: number;
  readonly lastSeenAt: number;
}
export interface DayRecord {
  readonly version: 1;
  readonly dateKey: string;
  readonly hosts: Record<string, HostStats>;
}
export interface Settings {
  readonly version: 1;
  readonly unit: "auto" | "mi" | "km";
  readonly dailyGoalMi: number;
  readonly theme: "auto" | "light" | "dark";
  readonly enabled: boolean;
  readonly snark: boolean;
  readonly position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}
export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  unit: "auto",
  dailyGoalMi: 1.0,
  theme: "auto",
  enabled: true,
  snark: true,
  position: "bottom-right",
};
