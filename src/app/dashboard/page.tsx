import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DashboardHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const businesses = await prisma.business.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { reviewEvents: true, feedbacks: true } } },
  });

  if (businesses.length === 0) {
    redirect("/dashboard/new");
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-cream">Le tue attività</h1>
        <Link
          href="/dashboard/new"
          className="rounded-lg bg-copper px-4 py-2 text-sm font-semibold text-cream transition hover:bg-copper/90"
        >
          + Aggiungi attività
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {businesses.map((business) => (
          <Link
            key={business.id}
            href={`/dashboard/${business.slug}`}
            className="rounded-2xl border border-line bg-surface p-6 transition hover:border-copper"
          >
            <p className="text-lg font-semibold text-cream">{business.name}</p>
            <p className="mt-1 text-sm text-muted">/r/{business.slug}</p>
            <div className="mt-4 flex gap-6 text-sm text-muted">
              <span>
                <strong className="text-cream">{business._count.reviewEvents}</strong> valutazioni
              </span>
              <span>
                <strong className="text-cream">{business._count.feedbacks}</strong> feedback privati
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
