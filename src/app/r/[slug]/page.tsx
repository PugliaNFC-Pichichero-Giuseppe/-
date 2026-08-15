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
      phone: true,
      ratingThreshold: true,
      primaryColor: true,
      accentColor: true,
      gaMeasurementId: true,
    },
  });

  if (!business) notFound();

  return <GateWidget business={business} channel={resolveChannel(sp.src)} />;
}
