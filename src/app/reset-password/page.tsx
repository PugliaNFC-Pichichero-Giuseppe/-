import Link from "next/link";
import { prisma } from "@/lib/db";
import { hashResetToken } from "@/lib/passwordReset";
import { ResetPasswordForm } from "./ResetPasswordForm";

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  let valid = false;
  if (token) {
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashResetToken(token) } });
    valid = !!record && record.expiresAt > new Date();
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center font-display text-2xl font-black uppercase text-cream">
          Recensioni <span className="text-copper">Smart</span>
        </Link>

        <div className="rounded-2xl border border-line bg-surface p-8">
          {valid && token ? (
            <>
              <h1 className="mb-1 text-xl font-semibold text-cream">Nuova password</h1>
              <p className="mb-6 text-sm text-muted">Scegline una da almeno 8 caratteri.</p>
              <ResetPasswordForm token={token} />
            </>
          ) : (
            <>
              <h1 className="mb-1 text-xl font-semibold text-cream">Link non valido o scaduto</h1>
              <p className="mb-6 text-sm text-muted">
                Richiedi un nuovo link dalla pagina di recupero password.
              </p>
              <Link
                href="/forgot-password"
                className="block rounded-lg bg-copper px-4 py-3 text-center font-semibold text-cream transition hover:bg-copper/90"
              >
                Richiedi un nuovo link
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
