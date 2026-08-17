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
    include: {
      business: { select: { ownerId: true, members: { where: { userId: user.id }, select: { id: true } } } },
    },
  });
  if (!feedback) return;
  const hasAccess = feedback.business.ownerId === user.id || feedback.business.members.length > 0;
  if (!hasAccess) return;

  await prisma.feedback.update({
    where: { id: feedback.id },
    data: { status: parsed.data.status },
  });
}

export type TeamFormState = { error?: string };

export async function addTeamMemberAction(
  slug: string,
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business || business.ownerId !== user.id) {
    return { error: "Azienda non trovata" };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "Inserisci un'email" };

  const member = await prisma.user.findUnique({ where: { email } });
  if (!member) {
    return { error: "Nessun account con questa email — deve prima registrarsi su Recensioni Smart, poi riprova" };
  }
  if (member.id === business.ownerId) {
    return { error: "Sei già il titolare di questa attività" };
  }

  await prisma.businessMember.upsert({
    where: { businessId_userId: { businessId: business.id, userId: member.id } },
    update: {},
    create: { businessId: business.id, userId: member.id },
  });

  return {};
}

export async function removeTeamMemberAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const memberId = String(formData.get("memberId") ?? "");
  if (!memberId) return;

  const member = await prisma.businessMember.findUnique({
    where: { id: memberId },
    include: { business: { select: { ownerId: true } } },
  });
  if (!member || member.business.ownerId !== user.id) return;

  await prisma.businessMember.delete({ where: { id: memberId } });
}
