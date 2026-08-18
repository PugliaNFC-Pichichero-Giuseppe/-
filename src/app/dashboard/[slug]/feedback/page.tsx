import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAccessibleBusiness } from "@/lib/business";
import { prisma } from "@/lib/db";
import { BusinessNav } from "@/components/BusinessNav";
import { updateFeedbackStatusAction } from "../../actions";

type Props = { params: Promise<{ slug: string }> };

const STATUS_LABEL: Record<string, string> = { new: "Nuovo", read: "Letto", resolved: "Risolto" };
const STATUS_CLASS: Record<string, string> = {
  new: "bg-amber/15 text-warning",
  read: "bg-line text-muted",
  resolved: "bg-success/15 text-success",
};

export default async function FeedbackInboxPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await getAccessibleBusiness(slug, user.id);
  if (!business) notFound();

  const feedbacks = await prisma.feedback.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <BusinessNav slug={business.slug} name={business.name} active="feedback" isOwner={business.isOwner} />

      {feedbacks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
          Nessun feedback privato ricevuto finora.
        </p>
      ) : (
        <ul className="space-y-4">
          {feedbacks.map((f) => (
            <li key={f.id} className="rounded-2xl border border-line bg-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold text-cream">{f.rating}★</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[f.status]}`}>
                    {STATUS_LABEL[f.status] ?? f.status}
                  </span>
                </div>
                <span className="text-xs text-muted">
                  {f.createdAt.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-cream">{f.comment}</p>

              {(f.contactName || f.contactInfo) && (
                <p className="mt-3 text-xs text-muted">
                  Contatto: {[f.contactName, f.contactInfo].filter(Boolean).join(" · ")}
                </p>
              )}

              <div className="mt-4 flex gap-2">
                {f.status !== "read" && (
                  <form action={updateFeedbackStatusAction}>
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="status" value="read" />
                    <button className="rounded-lg border border-line px-3 py-1.5 text-xs text-cream hover:border-accent">
                      Segna come letto
                    </button>
                  </form>
                )}
                {f.status !== "resolved" && (
                  <form action={updateFeedbackStatusAction}>
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="status" value="resolved" />
                    <button className="rounded-lg border border-line px-3 py-1.5 text-xs text-cream hover:border-accent">
                      Segna come risolto
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
