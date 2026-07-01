import { useSyncExternalStore } from "react";
import { createRoot, type Root } from "react-dom/client";
import { pickLandmark, formatComparison } from "../lib/landmarks";
import { formatFloorsShort } from "../lib/distance";
import { tier, SNARK } from "../lib/tiers";

export interface PillState {
  enabled: boolean;
  totalMi: number;
  metres: number;
  scrolling: boolean;
  unit: "mi" | "km";
  goalMi: number;
  theme: "light" | "dark";
  snark: boolean;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export interface PillStore {
  get(): PillState;
  subscribe(cb: () => void): () => void;
}

export function Pill({ store }: { store: PillStore }) {
  const s = useSyncExternalStore(store.subscribe, store.get, store.get);
  if (!s.enabled) return null;

  const t = tier(s.totalMi, s.goalMi);
  const short = formatFloorsShort(s.metres);
  const emoji = pickLandmark(s.metres).landmark.emoji;
  const snark = s.snark ? SNARK[t] : "";

  return (
    <div className="sm-root" data-position={s.position}>
      <div
        className={`sm-pill ${s.scrolling ? "" : "is-idle"}`}
        data-theme={s.theme}
        data-tier={t}
        role="status"
        aria-live="polite"
      >
        {/* full + mini share one grid cell; we crossfade opacity while the pill width glides */}
        <div className="sm-full">
          <span className="sm-lead">you scrolled</span>
          <span className="sm-val">{short}</span>
          {s.metres >= 30 ? <span className="sm-cmp">· {formatComparison(s.metres)}</span> : null}
        </div>
        <div className="sm-mini">
          <span className="sm-emoji">{emoji}</span>
          <span className="sm-val">{short}</span>
        </div>
      </div>
      {snark && s.scrolling ? <div className="sm-snark">{snark}</div> : null}
    </div>
  );
}

export function mountPill(container: HTMLElement, store: PillStore): Root {
  const root = createRoot(container);
  root.render(<Pill store={store} />);
  return root;
}
