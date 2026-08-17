"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { hashResetToken } from "@/lib/passwordReset";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";
import { resetPasswordSchema } from "@/lib/validation";

export type ResetPasswordState = { error?: string };

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, matches token expiry

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const tokenHash = hashResetToken(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.expiresAt < new Date()) {
    return { error: "Link non valido o scaduto — richiedine uno nuovo dalla pagina di recupero password" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const [user] = await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  const token = await createSessionToken({ sub: user.id, email: user.email });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/dashboard");
}
