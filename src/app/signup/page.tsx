"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction, type AuthState } from "./actions";
import { FormError, SubmitButton, inputClass, labelClass } from "@/components/form";

const initialState: AuthState = {};

export default function SignupPage() {
  const [state, formAction] = useActionState(signupAction, initialState);

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center font-display text-2xl font-black uppercase text-cream">
          Recensioni <span className="text-accent">Smart</span>
        </Link>

        <div className="rounded-2xl border border-line bg-surface p-8">
          <h1 className="mb-1 text-xl font-semibold text-cream">Crea il tuo account</h1>
          <p className="mb-6 text-sm text-muted">Prova gratis, nessuna carta richiesta.</p>

          <FormError message={state.error} />

          <form action={formAction} className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="name">
                Nome e cognome
              </label>
              <input className={inputClass} id="name" name="name" type="text" autoComplete="name" required />
            </div>
            <div>
              <label className={labelClass} htmlFor="email">
                Email
              </label>
              <input className={inputClass} id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div>
              <label className={labelClass} htmlFor="password">
                Password
              </label>
              <input
                className={inputClass}
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <p className="mt-2 text-xs text-muted">Almeno 8 caratteri.</p>
            </div>
            <SubmitButton pendingChildren="Creazione account…">Crea account</SubmitButton>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Hai già un account?{" "}
          <Link href="/login" className="font-semibold text-accent hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
