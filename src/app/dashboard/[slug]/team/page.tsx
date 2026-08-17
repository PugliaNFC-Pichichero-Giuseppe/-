import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAccessibleBusiness } from "@/lib/business";
import { prisma } from "@/lib/db";
import { BusinessNav } from "@/components/BusinessNav";
import { addTeamMemberAction, removeTeamMemberAction } from "../../actions";
import { AddTeamMemberForm } from "./AddTeamMemberForm";

type Props = { params: Promise<{ slug: string }> };

export default async function TeamPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await getAccessibleBusiness(slug, user.id);
  if (!business || !business.isOwner) notFound();

  const [owner, members] = await Promise.all([
    prisma.user.findUnique({ where: { id: business.ownerId }, select: { name: true, email: true } }),
    prisma.businessMember.findMany({
      where: { businessId: business.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const addAction = addTeamMemberAction.bind(null, business.slug);

  return (
    <div>
      <BusinessNav slug={business.slug} name={business.name} active="team" isOwner={business.isOwner} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-4 text-sm font-semibold text-cream">Chi ha accesso</h2>
          <ul className="divide-y divide-line">
            <li className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-cream">{owner?.name}</p>
                <p className="text-xs text-muted">{owner?.email}</p>
              </div>
              <span className="rounded-full bg-line px-2.5 py-1 text-xs font-semibold text-muted">Titolare</span>
            </li>
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-cream">{m.user.name}</p>
                  <p className="text-xs text-muted">{m.user.email}</p>
                </div>
                <form action={removeTeamMemberAction}>
                  <input type="hidden" name="memberId" value={m.id} />
                  <button className="text-xs text-danger hover:underline">Rimuovi</button>
                </form>
              </li>
            ))}
            {members.length === 0 && <li className="py-3 text-sm text-muted">Nessun collega aggiunto finora.</li>}
          </ul>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-1 text-sm font-semibold text-cream">Aggiungi un collega</h2>
          <p className="mb-4 text-xs text-muted">
            Deve avere già un account su Recensioni Smart (fallo registrare su{" "}
            <span className="font-mono">/signup</span> prima, se non ce l&apos;ha ancora). Vede panoramica e
            feedback, ma non può modificare le impostazioni.
          </p>
          <AddTeamMemberForm action={addAction} />
        </div>
      </div>
    </div>
  );
}
