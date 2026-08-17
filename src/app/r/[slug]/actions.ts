"use server";

import { prisma } from "@/lib/db";
import { feedbackSchema, reviewEventSchema } from "@/lib/validation";
import { sendFeedbackAlert } from "@/lib/email";
import { getBaseUrl } from "@/lib/url";

export type SubmitRatingResult =
  | { ok: true; reviewEventId: string; redirected: true; googleReviewUrl: string }
  | { ok: true; reviewEventId: string; redirected: false }
  | { ok: false; error: string };

export async function submitRatingAction(input: {
  slug: string;
  rating: number;
  channel: string;
}): Promise<SubmitRatingResult> {
  const parsed = reviewEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Valutazione non valida" };
  }

  const business = await prisma.business.findUnique({ where: { slug: parsed.data.slug } });
  if (!business) {
    return { ok: false, error: "Attività non trovata" };
  }

  const redirected = parsed.data.rating >= business.ratingThreshold;

  const reviewEvent = await prisma.reviewEvent.create({
    data: {
      businessId: business.id,
      rating: parsed.data.rating,
      channel: parsed.data.channel,
      redirected,
    },
  });

  if (redirected) {
    return { ok: true, reviewEventId: reviewEvent.id, redirected: true, googleReviewUrl: business.googleReviewUrl };
  }
  return { ok: true, reviewEventId: reviewEvent.id, redirected: false };
}

export type SubmitFeedbackResult = { ok: true } | { ok: false; error: string };

export async function submitFeedbackAction(input: {
  reviewEventId: string;
  comment: string;
  contactName?: string;
  contactInfo?: string;
}): Promise<SubmitFeedbackResult> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const reviewEvent = await prisma.reviewEvent.findUnique({
    where: { id: parsed.data.reviewEventId },
    include: {
      feedback: true,
      business: {
        select: {
          name: true,
          slug: true,
          owner: { select: { email: true } },
          members: { select: { user: { select: { email: true } } } },
        },
      },
    },
  });
  if (!reviewEvent) {
    return { ok: false, error: "Sessione scaduta, ricarica la pagina" };
  }
  if (reviewEvent.feedback) {
    return { ok: true };
  }

  await prisma.feedback.create({
    data: {
      businessId: reviewEvent.businessId,
      reviewEventId: reviewEvent.id,
      rating: reviewEvent.rating,
      comment: parsed.data.comment,
      contactName: parsed.data.contactName || null,
      contactInfo: parsed.data.contactInfo || null,
    },
  });

  const baseUrl = await getBaseUrl();
  const recipients = [reviewEvent.business.owner.email, ...reviewEvent.business.members.map((m) => m.user.email)];
  await sendFeedbackAlert({
    to: recipients,
    businessName: reviewEvent.business.name,
    feedbackUrl: `${baseUrl}/dashboard/${reviewEvent.business.slug}/feedback`,
    rating: reviewEvent.rating,
    comment: parsed.data.comment,
    contactName: parsed.data.contactName || null,
    contactInfo: parsed.data.contactInfo || null,
  });

  return { ok: true };
}
