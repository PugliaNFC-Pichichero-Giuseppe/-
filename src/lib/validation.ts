import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Nome troppo corto").max(80),
  email: z.email("Email non valida").trim().toLowerCase(),
  password: z.string().min(8, "Almeno 8 caratteri"),
});

export const loginSchema = z.object({
  email: z.email("Email non valida").trim().toLowerCase(),
  password: z.string().min(1, "Password richiesta"),
});

const optionalUrl = z.union([z.literal(""), z.url("URL non valido")]).optional();
const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Colore non valido");

export const businessSchema = z.object({
  name: z.string().trim().min(2, "Nome troppo corto").max(80),
  googleReviewUrl: z.url("Incolla il link \"Scrivi una recensione\" di Google"),
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  ratingThreshold: z.coerce.number().int().min(1).max(5),
  primaryColor: hexColor,
  accentColor: hexColor,
  gaMeasurementId: z.string().trim().max(40).optional().or(z.literal("")),
});

export const reviewEventSchema = z.object({
  slug: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  channel: z.enum(["nfc", "qr", "direct"]).default("direct"),
});

export const feedbackSchema = z.object({
  reviewEventId: z.string().min(1),
  comment: z.string().trim().min(1, "Scrivi qualche parola per aiutarci a capire").max(2000),
  contactName: z.string().trim().max(120).optional().or(z.literal("")),
  contactInfo: z.string().trim().max(200).optional().or(z.literal("")),
});

export const feedbackStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["new", "read", "resolved"]),
});
