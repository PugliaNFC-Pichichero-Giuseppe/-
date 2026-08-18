import Link from "next/link";

const TABS = [
  { key: "overview", label: "Panoramica", suffix: "", ownerOnly: false },
  { key: "feedback", label: "Feedback", suffix: "/feedback", ownerOnly: false },
  { key: "analysis", label: "Analisi", suffix: "/analysis", ownerOnly: false },
  { key: "team", label: "Team", suffix: "/team", ownerOnly: true },
  { key: "settings", label: "Impostazioni", suffix: "/settings", ownerOnly: true },
] as const;

export function BusinessNav({
  slug,
  name,
  active,
  isOwner,
}: {
  slug: string;
  name: string;
  active: (typeof TABS)[number]["key"];
  isOwner: boolean;
}) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-xs text-muted hover:text-cream">
            ← Tutte le attività
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-cream">{name}</h1>
        </div>
        <a
          href={`/r/${slug}`}
          target="_blank"
          rel="noopener"
          className="rounded-lg border border-line px-4 py-2 text-sm text-cream transition hover:border-accent"
        >
          Apri pagina pubblica ↗
        </a>
      </div>
      <nav className="mt-6 flex gap-6 border-b border-line text-sm">
        {TABS.filter((tab) => isOwner || !tab.ownerOnly).map((tab) => (
          <Link
            key={tab.key}
            href={`/dashboard/${slug}${tab.suffix}`}
            className={`-mb-px border-b-2 pb-3 font-medium transition ${
              active === tab.key ? "border-accent text-cream" : "border-transparent text-muted hover:text-cream"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
