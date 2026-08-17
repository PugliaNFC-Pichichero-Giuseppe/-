export function StatTile({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${emphasis ? "text-copper" : "text-cream"}`}>{value}</p>
    </div>
  );
}
