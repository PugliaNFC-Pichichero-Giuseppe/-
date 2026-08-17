import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { toggleBusinessStatusAction } from "./actions";

export default async function AdminPage() {
  await requireAdmin();

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { email: true, name: true } },
      _count: { select: { reviewEvents: true, feedbacks: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-cream">Admin — attività</h1>
      <p className="mt-2 text-sm text-muted">
        Sospendi l&apos;accesso a chi non ha rinnovato — blocca sia il cruscotto sia la pagina pubblica.
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-semibold">Attività</th>
              <th className="px-4 py-3 font-semibold">Titolare</th>
              <th className="px-4 py-3 font-semibold">Creata</th>
              <th className="px-4 py-3 font-semibold">Valutazioni</th>
              <th className="px-4 py-3 font-semibold">Stato</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((b) => {
              const isActive = b.status === "active";
              const nextStatus = isActive ? "suspended" : "active";
              return (
                <tr key={b.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-cream">{b.name}</p>
                    <p className="text-xs text-muted">/r/{b.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {b.owner.name}
                    <br />
                    <span className="text-xs">{b.owner.email}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{b.createdAt.toLocaleDateString("it-IT")}</td>
                  <td className="px-4 py-3 text-muted">{b._count.reviewEvents}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isActive ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                      }`}
                    >
                      {isActive ? "Attiva" : "Sospesa"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={toggleBusinessStatusAction}>
                      <input type="hidden" name="businessId" value={b.id} />
                      <input type="hidden" name="nextStatus" value={nextStatus} />
                      <button
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          isActive
                            ? "border-danger/40 text-danger hover:bg-danger/10"
                            : "border-success/40 text-success hover:bg-success/10"
                        }`}
                      >
                        {isActive ? "Sospendi" : "Riattiva"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {businesses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Nessuna attività creata finora.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
