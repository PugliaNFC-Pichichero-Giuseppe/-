import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAccessibleBusiness } from "@/lib/business";
import { BusinessNav } from "@/components/BusinessNav";
import { BusinessForm } from "@/components/BusinessForm";
import { updateBusinessAction } from "../../actions";

type Props = { params: Promise<{ slug: string }> };

export default async function BusinessSettingsPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await getAccessibleBusiness(slug, user.id);
  if (!business || !business.isOwner) notFound();

  const updateAction = updateBusinessAction.bind(null, business.slug);

  return (
    <div>
      <BusinessNav slug={business.slug} name={business.name} active="settings" isOwner={business.isOwner} />

      <div className="rounded-2xl border border-line bg-surface p-8">
        <h2 className="mb-6 text-lg font-semibold text-cream">Dettagli attività</h2>
        <BusinessForm
          action={updateAction}
          submitLabel="Salva modifiche"
          defaults={{
            name: business.name,
            googleReviewUrl: business.googleReviewUrl,
            instagramUrl: business.instagramUrl ?? undefined,
            phone: business.phone ?? undefined,
            ratingThreshold: business.ratingThreshold,
            primaryColor: business.primaryColor,
            accentColor: business.accentColor,
            gaMeasurementId: business.gaMeasurementId ?? undefined,
          }}
        />
      </div>
    </div>
  );
}
