import "server-only";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.NOTIFICATION_FROM_EMAIL ?? "Recensioni Smart <onboarding@resend.dev>";

// Best-effort: a failed send should never break feedback submission for the
// customer, so every caller path swallows and logs rather than throwing.
export async function sendFeedbackAlert(params: {
  to: string[];
  businessName: string;
  feedbackUrl: string;
  rating: number;
  comment: string;
  contactName: string | null;
  contactInfo: string | null;
}) {
  if (!resend || params.to.length === 0) return;

  const stars = "★".repeat(params.rating) + "☆".repeat(5 - params.rating);
  const contact = [params.contactName, params.contactInfo].filter(Boolean).join(" · ");

  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `Nuovo feedback ${params.rating}★ — ${params.businessName}`,
      html: `
        <p><strong>${params.businessName}</strong> ha ricevuto un feedback privato.</p>
        <p style="font-size:20px;letter-spacing:2px;">${stars}</p>
        <p>${escapeHtml(params.comment)}</p>
        ${contact ? `<p style="color:#655e50;">Contatto: ${escapeHtml(contact)}</p>` : ""}
        <p><a href="${params.feedbackUrl}">Apri la scheda feedback →</a></p>
      `,
    });
  } catch (err) {
    console.error("sendFeedbackAlert failed:", err);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
