import { useCallback, useEffect, useState, type ReactNode } from "react";
import { browser } from "wxt/browser";
import { WrappedCard } from "../../components/WrappedCard";
import { summarizeHome, type HomeData } from "../../lib/home";
import { readSettings, writeSettings, dayKey } from "../../lib/storage";
import { dateKey } from "../../lib/streak";
import { miToFloors, floorsToMi } from "../../lib/distance";
import type { Settings } from "../../lib/types";
import "../../components/wrapped.css";

/* ---- iOS-style controls ---- */

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors duration-200 active:scale-[0.96] ${
        checked ? "bg-white" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] h-[26px] w-[26px] rounded-full shadow-sm transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          checked ? "translate-x-[20px] bg-[#1f1f22]" : "bg-white"
        }`}
      />
    </button>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-[9px] bg-white/[0.08] p-[2px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-[7px] px-2.5 py-[5px] text-xs font-semibold transition duration-150 ease-out active:scale-[0.96] ${
            value === o.value ? "bg-white/[0.16] text-white shadow-sm" : "text-white/55 hover:text-white/80"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-sm text-white/85">{label}</span>
      {children}
    </div>
  );
}

/* ---- data ---- */

interface View {
  settings: Settings;
  home: HomeData;
}

async function load(): Promise<View> {
  const settings = await readSettings();
  const all = (await browser.storage.local.get(null)) as Record<string, unknown>;
  const home = summarizeHome(all, dateKey(new Date()), settings);
  return { settings, home };
}

export default function App() {
  const [view, setView] = useState<View | null>(null);
  const [tab, setTab] = useState<"home" | "settings">("home");
  const refresh = useCallback(() => void load().then(setView), []);

  useEffect(() => {
    refresh();
    const onChange = (_changes: Record<string, unknown>, area: string) => {
      if (area === "local") refresh();
    };
    browser.storage.onChanged.addListener(onChange);
    return () => browser.storage.onChanged.removeListener(onChange);
  }, [refresh]);

  if (!view) return <div className="p-12 text-center text-sm text-white/50">Loading…</div>;
  const { settings, home } = view;
  const set = (patch: Partial<Settings>) => void writeSettings(patch).then(refresh);
  const onReset = async () => {
    await browser.storage.local.remove(dayKey(home.dateKey));
    refresh();
  };

  return (
    <div className="flex flex-col gap-3.5 p-3.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
          {tab === "home" ? "Today" : "Settings"}
        </span>
        <button
          type="button"
          aria-label={tab === "home" ? "Settings" : "Back"}
          onClick={() => setTab(tab === "home" ? "settings" : "home")}
          className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/[0.08] hover:text-white/90 active:scale-[0.94]"
        >
          {tab === "home" ? <GearIcon /> : <BackIcon />}
        </button>
      </div>

      {tab === "home" ? (
        <WrappedCard data={home} />
      ) : (
        <>
          <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl bg-white/[0.04]">
            <Row label="Daily limit">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={10}
                  step={10}
                  value={Math.round(miToFloors(settings.dailyGoalMi))}
                  onChange={(e) => set({ dailyGoalMi: floorsToMi(Number(e.target.value) || 500) })}
                  className="w-16 rounded-lg bg-white/[0.1] px-2.5 py-1.5 text-right text-sm tabular-nums outline-none focus:bg-white/[0.15]"
                />
                <span className="text-sm text-white/45">floors</span>
              </div>
            </Row>
            <Row label="Theme">
              <Segmented
                value={settings.theme}
                onChange={(v) => set({ theme: v })}
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
              />
            </Row>
            <Row label="Show pill">
              <Toggle checked={settings.enabled} onChange={(v) => set({ enabled: v })} />
            </Row>
            <Row label="Position">
              <Segmented
                value={settings.position}
                onChange={(v) => set({ position: v })}
                options={[
                  { value: "top-left", label: "↖" },
                  { value: "top-right", label: "↗" },
                  { value: "bottom-left", label: "↙" },
                  { value: "bottom-right", label: "↘" },
                ]}
              />
            </Row>
            <Row label="Snark">
              <Toggle checked={settings.snark} onChange={(v) => set({ snark: v })} />
            </Row>
          </div>
          <button
            type="button"
            onClick={() => void onReset()}
            className="w-full rounded-xl bg-white/[0.06] py-2.5 text-sm font-semibold text-white/85 transition duration-150 ease-out hover:bg-white/[0.1] active:scale-[0.98]"
          >
            Reset today
          </button>
        </>
      )}
    </div>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19.4 13a7.9 7.9 0 0 0 0-2l1.7-1.3-1.7-3-2 .8a8 8 0 0 0-1.7-1l-.3-2.1h-3.4l-.3 2.1a8 8 0 0 0-1.7 1l-2-.8-1.7 3L6.6 11a7.9 7.9 0 0 0 0 2l-1.7 1.3 1.7 3 2-.8a8 8 0 0 0 1.7 1l.3 2.1h3.4l.3-2.1a8 8 0 0 0 1.7-1l2 .8 1.7-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
