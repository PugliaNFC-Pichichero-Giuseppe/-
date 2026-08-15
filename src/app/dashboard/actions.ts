"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";
import { uniqueSlug } from "@/lib/slug";
import { businessSchema, feedbackStatusSchema } from "@/lib/validation";

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

export type BusinessFormState = { error?: string };

function readBusinessForm(formData: FormData) {
  return businessSchema.safeParse({
    name: formData.get("name"),
    googleReviewUrl: formData.get("googleReviewUrl"),
    instagramUrl: formData.get("instagramUrl"),
    phone: formData.get("phone"),
    ratingThreshold: formData.get("ratingThreshold"),
    primaryColor: formData.get("primaryColor"),
    accentColor: formData.get("accentColor"),
    gaMeasurementId: formData.get("gaMeasurementId"),
  });
}

export async function createBusinessAction(
  _prev: BusinessFormState,
  formData: FormData,
): Promise<BusinessFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = readBusinessForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const data = parsed.data;
  const slug = await uniqueSlug(data.name);

  const business = await prisma.business.create({
    data: {
      ownerId: user.id,
      slug,
      name: data.name,
      googleReviewUrl: data.googleReviewUrl,
      instagramUrl: data.instagramUrl || null,
      phone: data.phone || null,
      ratingThreshold: data.ratingThreshold,
      primaryColor: data.primaryColor,
      accentColor: data.accentColor,
      gaMeasurementId: data.gaMeasurementId || null,
    },
  });

  redirect(`/dashboard/${business.slug}?created=1`);
}

export async function updateBusinessAction(
  slug: string,
  _prev: BusinessFormState,
  formData: FormData,
): Promise<BusinessFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business || business.ownerId !== user.id) {
    return { error: "Azienda non trovata" };
  }

  const parsed = readBusinessForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const data = parsed.data;

  await prisma.business.update({
    where: { id: business.id },
    data: {
      name: data.name,
      googleReviewUrl: data.googleReviewUrl,
      instagramUrl: data.instagramUrl || null,
      phone: data.phone || null,
      ratingThreshold: data.ratingThreshold,
      primaryColor: data.primaryColor,
      accentColor: data.accentColor,
      gaMeasurementId: data.gaMeasurementId || null,
    },
  });

  return {};
}

export async function updateFeedbackStatusAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = feedbackStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const feedback = await prisma.feedback.findUnique({
    where: { id: parsed.data.id },
    include: { business: { select: { ownerId: true } } },
  });
  if (!feedback || feedback.business.ownerId !== user.id) return;

  await prisma.feedback.update({
    where: { id: feedback.id },
    data: { status: parsed.data.status },
  });
}
