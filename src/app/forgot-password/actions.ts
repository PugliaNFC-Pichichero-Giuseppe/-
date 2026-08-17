"use server";

import { prisma } from "@/lib/db";
import { generateResetToken } from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/url";
import { forgotPasswordSchema } from "@/lib/validation";

export type ForgotPasswordState = { submitted?: boolean; error?: string };

// Always resolves to { submitted: true } for a well-formed email, whether or
// not an account exists — never lets a caller probe which emails are registered.
export async function requestPasswordResetAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (user) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    const { token, tokenHash, expiresAt } = generateResetToken();
    await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

    const baseUrl = await getBaseUrl();
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl: `${baseUrl}/reset-password?token=${token}`,
    });
  }

  return { submitted: true };
}
