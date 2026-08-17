import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedBusiness } from "@/lib/business";
import { prisma } from "@/lib/db";
import { BusinessNav } from "@/components/BusinessNav";
import { StatTile } from "@/components/StatTile";
import { RatingBars } from "@/components/RatingBars";

type Props = { params: Promise<{ slug: string }> };

export default async function BusinessOverviewPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await getOwnedBusiness(slug, user.id);
  if (!business) notFound();

  const [totalEvents, avgAgg, redirectedCount, newFeedbackCount, distribution, recentFeedback] = await Promise.all([
    prisma.reviewEvent.count({ where: { businessId: business.id } }),
    prisma.reviewEvent.aggregate({ where: { businessId: business.id }, _avg: { rating: true } }),
    prisma.reviewEvent.count({ where: { businessId: business.id, redirected: true } }),
    prisma.feedback.count({ where: { businessId: business.id, status: "new" } }),
    prisma.reviewEvent.groupBy({ by: ["rating"], where: { businessId: business.id }, _count: { rating: true } }),
    prisma.feedback.findMany({ where: { businessId: business.id }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);

  const counts = [1, 2, 3, 4, 5].map((r) => distribution.find((d) => d.rating === r)?._count.rating ?? 0);
  const conversionPct = totalEvents > 0 ? Math.round((redirectedCount / totalEvents) * 100) : 0;
  const avgRating = avgAgg._avg.rating;

  return (
    <div>
      <BusinessNav slug={business.slug} name={business.name} active="overview" />

      {totalEvents === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-lg font-semibold text-cream">Ancora nessuna valutazione</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Condividi la pagina pubblica tramite card NFC, QR code o link diretto — trovi tutto in
            Impostazioni. Le statistiche appariranno qui appena arriva la prima valutazione.
          </p>
          <Link
            href={`/dashboard/${business.slug}/settings`}
            className="mt-6 inline-block rounded-lg bg-copper px-5 py-2.5 text-sm font-semibold text-cream hover:bg-copper/90"
          >
            Vai a Impostazioni
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Valutazioni totali" value={String(totalEvents)} />
            <StatTile label="Voto medio" value={avgRating ? avgRating.toFixed(1) : "—"} />
            <StatTile label="Mandati su Google" value={`${redirectedCount} (${conversionPct}%)`} />
            <StatTile
              label="Feedback da leggere"
              value={String(newFeedbackCount)}
              emphasis={newFeedbackCount > 0}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
            <h2 className="text-sm font-semibold text-cream">Distribuzione voti</h2>
            <div className="mt-6">
              <RatingBars counts={counts} />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-cream">Ultimo feedback privato</h2>
              <Link href={`/dashboard/${business.slug}/feedback`} className="text-sm text-copper hover:underline">
                Vedi tutto →
              </Link>
            </div>
            {recentFeedback.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Nessun feedback privato ricevuto finora.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {recentFeedback.map((f) => (
                  <li key={f.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-cream">{f.rating}★ · {f.contactName || "Anonimo"}</span>
                      <span className="text-xs text-muted">{f.createdAt.toLocaleDateString("it-IT")}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{f.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
