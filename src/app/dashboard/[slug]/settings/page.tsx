import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedBusiness } from "@/lib/business";
import { BusinessNav } from "@/components/BusinessNav";
import { BusinessForm } from "@/components/BusinessForm";
import { updateBusinessAction } from "../../actions";

type Props = { params: Promise<{ slug: string }> };

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function BusinessSettingsPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await getOwnedBusiness(slug, user.id);
  if (!business) notFound();

  const baseUrl = await getBaseUrl();
  const publicUrl = `${baseUrl}/r/${business.slug}`;
  const qrTargetUrl = `${publicUrl}?src=qr`;
  const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
    width: 480,
    margin: 1,
    color: { dark: "#211C16", light: "#FFFFFF" },
  });

  const updateAction = updateBusinessAction.bind(null, business.slug);

  return (
    <div>
      <BusinessNav slug={business.slug} name={business.name} active="settings" />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
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

        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="text-sm font-semibold text-cream">Pagina pubblica</h2>
            <p className="mt-3 break-all rounded-lg bg-bg px-3 py-2 text-xs text-muted">{publicUrl}</p>

            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Link per card NFC</h3>
            <p className="mt-2 break-all rounded-lg bg-bg px-3 py-2 text-xs text-muted">{publicUrl}?src=nfc</p>

            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">QR code</h3>
            <p className="mt-2 text-xs text-muted">Stampalo su tavoli, vetrina o scontrino.</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, no next/image optimization needed */}
            <img src={qrDataUrl} alt={`QR code per ${business.name}`} className="mt-3 w-full rounded-lg" />
            <a
              href={qrDataUrl}
              download={`qr-${business.slug}.png`}
              className="mt-3 block rounded-lg border border-line px-4 py-2 text-center text-sm text-cream transition hover:border-copper"
            >
              Scarica QR
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
