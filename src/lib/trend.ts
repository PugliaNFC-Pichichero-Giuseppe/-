export type WeeklyTrendPoint = { weekStart: Date; avgRating: number; count: number };

// One point per week that had at least one rating — weeks with none are left
// out entirely rather than interpolated, so the line never implies a rating
// for a week nothing happened. Capped to the most recent `maxWeeks`.
export function bucketRatingsByWeek(
  events: { rating: number; createdAt: Date }[],
  maxWeeks = 12,
): WeeklyTrendPoint[] {
  const buckets = new Map<string, { sum: number; count: number; weekStart: Date }>();

  for (const e of events) {
    const weekStart = startOfWeek(e.createdAt);
    const key = weekStart.toISOString();
    const existing = buckets.get(key);
    if (existing) {
      existing.sum += e.rating;
      existing.count += 1;
    } else {
      buckets.set(key, { sum: e.rating, count: 1, weekStart });
    }
  }

  return [...buckets.values()]
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
    .map((b) => ({ weekStart: b.weekStart, avgRating: b.sum / b.count, count: b.count }))
    .slice(-maxWeeks);
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
