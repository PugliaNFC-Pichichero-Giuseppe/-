"use client";

import { useRef, useState } from "react";

export type TrendPoint = { weekStart: string; avgRating: number; count: number };

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { top: 16, right: 12, bottom: 24, left: 28 };
const PLOT_WIDTH = WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;

function xFor(i: number, count: number) {
  return PADDING.left + (count === 1 ? PLOT_WIDTH / 2 : (i / (count - 1)) * PLOT_WIDTH);
}

function yFor(rating: number) {
  return PADDING.top + PLOT_HEIGHT - ((rating - 1) / 4) * PLOT_HEIGHT;
}

function weekLabel(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

export function RatingTrendChart({ points }: { points: TrendPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i, points.length)} ${yFor(p.avgRating)}`).join(" ");
  const areaPath = `${linePath} L ${xFor(points.length - 1, points.length)} ${PADDING.top + PLOT_HEIGHT} L ${xFor(0, points.length)} ${PADDING.top + PLOT_HEIGHT} Z`;
  const last = points[points.length - 1];
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const localX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let minDist = Infinity;
    points.forEach((_, i) => {
      const dist = Math.abs(xFor(i, points.length) - localX);
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  return (
    <div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full touch-none"
          role="img"
          aria-label="Andamento del voto medio settimanale"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          {[1, 2, 3, 4, 5].map((r) => (
            <g key={r}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={yFor(r)}
                y2={yFor(r)}
                stroke="var(--line)"
                strokeWidth={1}
              />
              <text x={PADDING.left - 8} y={yFor(r)} textAnchor="end" dominantBaseline="middle" fill="var(--muted)" fontSize={10}>
                {r}
              </text>
            </g>
          ))}

          <path d={areaPath} fill="var(--copper)" fillOpacity={0.1} stroke="none" />
          <path d={linePath} fill="none" stroke="var(--copper)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {hoverIndex !== null && (
            <line
              x1={xFor(hoverIndex, points.length)}
              x2={xFor(hoverIndex, points.length)}
              y1={PADDING.top}
              y2={PADDING.top + PLOT_HEIGHT}
              stroke="var(--line)"
              strokeWidth={1}
            />
          )}

          <circle
            cx={xFor(points.length - 1, points.length)}
            cy={yFor(last.avgRating)}
            r={4}
            fill="var(--copper)"
            stroke="var(--surface)"
            strokeWidth={2}
          />
          <text
            x={xFor(points.length - 1, points.length)}
            y={yFor(last.avgRating) - 10}
            textAnchor="end"
            fill="var(--cream)"
            fontSize={12}
            fontWeight={600}
          >
            {last.avgRating.toFixed(1)}
          </text>

          {hovered && hoverIndex !== null && hoverIndex !== points.length - 1 && (
            <circle
              cx={xFor(hoverIndex, points.length)}
              cy={yFor(hovered.avgRating)}
              r={5}
              fill="var(--copper)"
              stroke="var(--surface)"
              strokeWidth={2}
            />
          )}
        </svg>

        {hovered && hoverIndex !== null && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-[calc(100%+12px)] whitespace-nowrap rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg"
            style={{
              left: `${(xFor(hoverIndex, points.length) / WIDTH) * 100}%`,
              top: `${(yFor(hovered.avgRating) / HEIGHT) * 100}%`,
            }}
          >
            <p className="font-semibold text-cream">{hovered.avgRating.toFixed(1)} ★ medio</p>
            <p className="text-muted">
              settimana del {weekLabel(hovered.weekStart)} · {hovered.count} valutazion{hovered.count === 1 ? "e" : "i"}
            </p>
          </div>
        )}
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-muted hover:text-cream">Vedi i dati in tabella</summary>
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="py-1.5 font-semibold">Settimana del</th>
              <th className="py-1.5 font-semibold">Voto medio</th>
              <th className="py-1.5 font-semibold">Valutazioni</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.weekStart} className="border-b border-line last:border-0">
                <td className="py-1.5 text-cream">{weekLabel(p.weekStart)}</td>
                <td className="py-1.5 text-cream">{p.avgRating.toFixed(1)}</td>
                <td className="py-1.5 text-cream">{p.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
