"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError as GeminiApiError } from "@google/genai";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getAccessibleBusiness } from "@/lib/business";
import { SESSION_COOKIE } from "@/lib/session";
import { uniqueSlug } from "@/lib/slug";
import { businessSchema, feedbackStatusSchema } from "@/lib/validation";
import { analyzeFeedback, AnalysisUnavailableError, AnalysisParseError, MIN_FEEDBACK_FOR_ANALYSIS } from "@/lib/analysis";

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
    facebookUrl: formData.get("facebookUrl"),
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
      facebookUrl: data.facebookUrl || null,
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
      facebookUrl: data.facebookUrl || null,
      phone: data.phone || null,
      ratingThreshold: data.ratingThreshold,
      primaryColor: data.primaryColor,
      accentColor: data.accentColor,
      gaMeasurementId: data.gaMeasurementId || null,
    },
  });

  refresh();
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

  refresh();
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

  refresh();
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
  refresh();
}

export type AnalysisFormState = { error?: string };

export async function runFeedbackAnalysisAction(slug: string): Promise<AnalysisFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await getAccessibleBusiness(slug, user.id);
  if (!business) return { error: "Attività non trovata" };

  const feedbacks = await prisma.feedback.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    select: { rating: true, comment: true },
  });

  if (feedbacks.length < MIN_FEEDBACK_FOR_ANALYSIS) {
    return {
      error: `Servono almeno ${MIN_FEEDBACK_FOR_ANALYSIS} feedback per generare un'analisi (al momento ${feedbacks.length}).`,
    };
  }

  try {
    const result = await analyzeFeedback(business.name, feedbacks);
    await prisma.feedbackAnalysis.upsert({
      where: { businessId: business.id },
      create: {
        businessId: business.id,
        summary: result.summary,
        themes: result.themes,
        feedbackCount: feedbacks.length,
      },
      update: {
        summary: result.summary,
        themes: result.themes,
        feedbackCount: feedbacks.length,
        generatedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("runFeedbackAnalysisAction failed:", err);
    if (err instanceof AnalysisUnavailableError) {
      return { error: "Analisi AI non configurata — manca GEMINI_API_KEY nelle variabili d'ambiente." };
    }
    if (err instanceof AnalysisParseError) {
      return { error: "Il servizio AI non ha risposto correttamente — riprova." };
    }
    if (err instanceof GeminiApiError) {
      if (err.status === 401 || err.status === 403) {
        return { error: "Chiave API Gemini non valida — controlla GEMINI_API_KEY." };
      }
      if (err.status === 429) {
        return { error: "Limite di richieste AI gratuite raggiunto per ora — riprova tra poco." };
      }
      return { error: "Il servizio AI non ha risposto correttamente — riprova." };
    }
    return { error: "Errore imprevisto durante l'analisi — riprova." };
  }

  refresh();
  return {};
}
