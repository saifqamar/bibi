import { useState } from "react";

export interface DropoffPoint {
  minute: number;
  count: number;
}

const HEIGHT = 180;
const PAD = { top: 24, right: 8, bottom: 28, left: 32 };
const SLOT = 28;
const BAR = 22; // <= 24px, the rest of the slot is air
const RADIUS = 4;

/** Column with a 4px rounded top and a square base on the baseline. */
function columnPath(x: number, y: number, width: number, height: number): string {
  const r = Math.min(RADIUS, height / 2, width / 2);
  return `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`;
}

/** Where listeners stopped, by minute. The steepest minute is emphasised and labelled. */
export function DropoffChart({ points, durationMinutes }: { points: DropoffPoint[]; durationMinutes: number | null }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const lastMinute = Math.max(Math.ceil(durationMinutes ?? 0) - 1, ...points.map((p) => p.minute), 0);
  const minutes = Array.from({ length: lastMinute + 1 }, (_, m) => ({ minute: m, count: points.find((p) => p.minute === m)?.count ?? 0 }));
  const total = minutes.reduce((sum, p) => sum + p.count, 0);
  const max = Math.max(1, ...minutes.map((p) => p.count));
  const steepest = total ? minutes.reduce((a, b) => (b.count > a.count ? b : a)) : null;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const width = PAD.left + minutes.length * SLOT + PAD.right;
  const y = (count: number) => PAD.top + plotHeight - (count / max) * plotHeight;
  const labelEvery = minutes.length > 30 ? 5 : minutes.length > 12 ? 2 : 1;

  if (total === 0) return <p className="text-sm text-muted-foreground">No drop-offs recorded yet.</p>;

  return (
    <figure className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <figcaption className="text-sm text-muted-foreground">
          Listeners who stopped, by minute.{" "}
          {steepest && (
            <span className="text-foreground">
              Most stop in minute {steepest.minute + 1} ({steepest.count} of {total}).
            </span>
          )}
        </figcaption>
        <button type="button" className="text-xs text-primary underline" onClick={() => setAsTable((v) => !v)}>
          {asTable ? "Show chart" : "Show table"}
        </button>
      </div>
      {asTable ? (
        <table className="w-auto text-sm" aria-label="Drop-off by minute">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pr-6 font-medium">Minute</th>
              <th className="font-medium">Stopped</th>
            </tr>
          </thead>
          <tbody>
            {minutes.map((p) => (
              <tr key={p.minute}>
                <td className="pr-6 tabular-nums">{p.minute + 1}</td>
                <td className="tabular-nums">{p.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative overflow-x-auto rounded-[var(--radius)] bg-[var(--color-chart-surface)]">
          <svg width={width} height={HEIGHT} role="img" aria-label={`Drop-off by minute, ${total} listeners`}>
            {/* Recessive max reference */}
            <text x={PAD.left - 6} y={y(max) + 4} textAnchor="end" fontSize={11} fill="var(--color-chart-axis)">
              {max}
            </text>
            {minutes.map((p, i) => {
              const x = PAD.left + i * SLOT + (SLOT - BAR) / 2;
              const top = y(p.count);
              const emphasised = steepest?.minute === p.minute;
              return (
                <g
                  key={p.minute}
                  tabIndex={0}
                  role="graphics-symbol"
                  aria-label={`Minute ${p.minute + 1}: ${p.count} stopped`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="outline-none"
                >
                  {/* Hit target spans the whole slot, taller than the mark */}
                  <rect x={PAD.left + i * SLOT} y={PAD.top} width={SLOT} height={plotHeight} fill="transparent" />
                  {p.count > 0 && (
                    <path
                      d={columnPath(x, top, BAR, y(0) - top)}
                      fill={emphasised ? "var(--color-chart-emphasis)" : "var(--color-chart-bar)"}
                      stroke="var(--color-chart-surface)"
                      strokeWidth={2}
                    />
                  )}
                  {emphasised && (
                    <text x={x + BAR / 2} y={top - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="currentColor">
                      {p.count}
                    </text>
                  )}
                  {(p.minute % labelEvery === 0 || emphasised) && (
                    <text x={x + BAR / 2} y={HEIGHT - 10} textAnchor="middle" fontSize={11} fill="var(--color-chart-axis)">
                      {p.minute + 1}
                    </text>
                  )}
                </g>
              );
            })}
            {/* Recessive baseline, drawn last so the bars' surface gap does not cut it */}
            <line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} stroke="var(--color-chart-axis)" strokeOpacity={0.4} />
          </svg>
          {hover !== null && (
            <div
              role="tooltip"
              className="pointer-events-none absolute top-1 rounded border border-border bg-background px-2 py-1 text-xs shadow"
              style={{ left: Math.min(PAD.left + hover * SLOT, width - 120) }}
            >
              Minute {minutes[hover].minute + 1}: <strong>{minutes[hover].count}</strong> stopped
              {total > 0 && ` (${Math.round((minutes[hover].count / total) * 100)}%)`}
            </div>
          )}
          <p className="px-2 pb-1 text-xs text-muted-foreground">Minute of the episode</p>
        </div>
      )}
    </figure>
  );
}
