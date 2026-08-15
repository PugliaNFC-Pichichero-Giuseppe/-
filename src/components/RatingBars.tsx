// Validated ordinal ramp (single hue, monotone OKLCH lightness), one step per
// star rating — checked with scripts/validate_palette.js --ordinal against
// this app's dark surface (#1A2E23): all four checks pass, worst adjacent
// ΔL 0.065, light end (1 star) 2.28:1 contrast.
const RATING_RAMP = ["#9d4616", "#b05c1e", "#c17429", "#d28c36", "#e1a447"];

export function RatingBars({ counts }: { counts: number[] }) {
  const max = Math.max(1, ...counts);

  return (
    <div className="flex h-40 items-end justify-between gap-3 sm:gap-6">
      {counts.map((count, i) => {
        const rating = i + 1;
        const heightPct = count === 0 ? 0 : Math.max(6, Math.round((count / max) * 100));
        return (
          <div key={rating} className="flex flex-1 flex-col items-center">
            <span className="mb-2 text-sm font-semibold text-cream" style={{ fontVariantNumeric: "tabular-nums" }}>
              {count}
            </span>
            <div className="flex h-28 w-full max-w-6 items-end justify-center">
              <div
                title={`${count} valutazion${count === 1 ? "e" : "i"} a ${rating} stelle`}
                className="w-full max-w-6 rounded-t-[4px] transition-[height]"
                style={{ height: `${heightPct}%`, minHeight: 2, backgroundColor: RATING_RAMP[i] }}
              />
            </div>
            <span className="mt-2 text-xs text-muted">{rating}★</span>
          </div>
        );
      })}
    </div>
  );
}
