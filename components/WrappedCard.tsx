import { formatComparison } from "../lib/landmarks";
import { formatFloors, formatFloorsShort } from "../lib/distance";
import { GoalRing } from "./GoalRing";
import { Favicon } from "./Favicon";
import type { HomeData } from "../lib/home";
import iconSource from "../assets/icon-source.svg";

const METRES_PER_MILE = 1609.344;
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function WrappedCard({ data }: { data: HomeData }) {
  const big = formatFloors(data.metres);
  const max = Math.max(0.0001, ...data.sites.map((s) => s.mi));
  const weekMax = Math.max(1, ...data.week);

  return (
    <div className="sw-card">
      <div className="sw-head">
        <div className="sw-id">
          <img className="sw-glyph" src={iconSource} alt="" />
          <span className="sw-name">Scroll Meter</span>
        </div>
        <span className="sw-date">today</span>
      </div>

      <div className="sw-hero">
        <div className="sw-hero-main">
          <div className="sw-overline">you scrolled</div>
          <div className="sw-num">
            {big.value}
            <small>{big.unit}</small>
          </div>
          {data.metres >= 30 ? (
            <div className="sw-cmp">about {formatComparison(data.metres)}</div>
          ) : null}
        </div>
        <GoalRing fraction={data.goalFraction} />
      </div>

      {data.streak > 0 ? (
        <div className="sw-chip">
          🔥 <b>{data.streak}-day streak</b>
          {data.bestStreak > data.streak ? (
            <span className="sw-chip-sub">· best {data.bestStreak}</span>
          ) : null}
        </div>
      ) : null}

      {data.sites.length > 0 ? (
        <div className="sw-list">
          <div className="sw-list-label">top sites today</div>
          {data.sites.map((s) => (
            <div className="sw-row" key={s.host}>
              <Favicon host={s.host} />
              <span className="sw-site">{s.host.replace(/^www\./, "")}</span>
              <span className="sw-track">
                <span className="sw-fill" style={{ width: `${(s.mi / max) * 100}%` }} />
              </span>
              <span className="sw-amt">{formatFloorsShort(s.mi * METRES_PER_MILE)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="sw-empty">Nothing tracked yet today.</div>
      )}

      <div className="sw-week">
        <div className="sw-week-bars" role="img" aria-label="last 7 days">
          {data.week.map((m, i) => (
            <span
              key={i}
              className={`sw-bar${i === 6 ? " is-today" : ""}`}
              style={{ height: `${Math.max(8, (m / weekMax) * 100)}%` }}
              title={DAYS[i]}
            />
          ))}
        </div>
        <div className="sw-week-total">
          <div className="sw-week-cap">7-day total</div>
          <div className="sw-week-num">{formatFloorsShort(data.weekTotalMetres)}</div>
        </div>
      </div>
    </div>
  );
}
