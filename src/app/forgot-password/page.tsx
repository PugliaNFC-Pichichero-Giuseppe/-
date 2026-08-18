"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type ForgotPasswordState } from "./actions";
import { FormError, SubmitButton, inputClass, labelClass } from "@/components/form";

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialState);

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center font-display text-2xl font-black uppercase text-cream">
          Recensioni <span className="text-accent">Smart</span>
        </Link>

        <div className="rounded-2xl border border-line bg-surface p-8">
          <h1 className="mb-1 text-xl font-semibold text-cream">Recupera password</h1>
          <p className="mb-6 text-sm text-muted">Ti mandiamo un link per impostarne una nuova.</p>

          {state.submitted ? (
            <p className="text-sm text-cream">
              Se l&apos;indirizzo che hai inserito corrisponde a un account, riceverai a breve un&apos;email con
              le istruzioni per reimpostare la password.
            </p>
          ) : (
            <>
              <FormError message={state.error} />
              <form action={formAction} className="space-y-5">
                <div>
                  <label className={labelClass} htmlFor="email">
                    Email
                  </label>
                  <input
                    className={inputClass}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
                <SubmitButton pendingChildren="Invio…">Invia link</SubmitButton>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="font-semibold text-accent hover:underline">
            ← Torna al login
          </Link>
        </p>
      </div>
    </div>
  );
}
