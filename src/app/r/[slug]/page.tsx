import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { GateWidget } from "./GateWidget";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function resolveChannel(raw: string | string[] | undefined): "nfc" | "qr" | "direct" {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "nfc" || value === "qr" ? value : "direct";
}

export default async function ReviewGatePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      googleReviewUrl: true,
      instagramUrl: true,
      facebookUrl: true,
      phone: true,
      ratingThreshold: true,
      primaryColor: true,
      accentColor: true,
      gaMeasurementId: true,
      status: true,
    },
  });

  if (!business) notFound();
  if (business.status === "suspended") {
    return (
      <div className="flex min-h-svh items-center justify-center px-5 text-center">
        <p className="text-sm text-muted">Questa pagina non è al momento disponibile.</p>
      </div>
    );
  }

  return <GateWidget business={business} channel={resolveChannel(sp.src)} />;
}
