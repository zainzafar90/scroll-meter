export function GoalRing({ fraction, size = 60 }: { fraction: number; size?: number }) {
  const stroke = 5;
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, fraction));
  const dash = pct * c;
  const cx = size / 2;
  return (
    <svg className="sw-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle className="sw-ring-track" cx={cx} cy={cx} r={r} fill="none" strokeWidth={stroke} />
      <circle
        className="sw-ring-arc"
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <text className="sw-ring-label" x={cx} y={cx + 4} textAnchor="middle">
        {Math.round(fraction * 100)}%
      </text>
    </svg>
  );
}
