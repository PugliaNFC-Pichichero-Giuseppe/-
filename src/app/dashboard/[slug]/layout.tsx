import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAccessibleBusiness } from "@/lib/business";

type Props = { children: React.ReactNode; params: Promise<{ slug: string }> };

export default async function BusinessLayout({ children, params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await getAccessibleBusiness(slug, user.id);
  if (!business) notFound();

  if (business.status === "suspended") {
    return (
      <div className="rounded-2xl border border-dashed border-line p-10 text-center">
        <p className="text-lg font-semibold text-cream">Accesso sospeso</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          L&apos;accesso a <strong className="text-cream">{business.name}</strong> è temporaneamente sospeso.
          Contatta il tuo fornitore del servizio per riattivarlo.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
