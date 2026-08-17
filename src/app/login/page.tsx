"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthState } from "./actions";
import { FormError, SubmitButton, inputClass, labelClass } from "@/components/form";

const initialState: AuthState = {};

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center font-display text-2xl font-black uppercase text-cream">
          Recensioni <span className="text-copper">Smart</span>
        </Link>

        <div className="rounded-2xl border border-line bg-surface p-8">
          <h1 className="mb-1 text-xl font-semibold text-cream">Bentornato</h1>
          <p className="mb-6 text-sm text-muted">Accedi alla tua dashboard.</p>

          <FormError message={state.error} />

          <form action={formAction} className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="email">
                Email
              </label>
              <input className={inputClass} id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className={labelClass} htmlFor="password">
                  Password
                </label>
                <Link href="/forgot-password" className="mb-2 text-xs text-muted hover:text-copper">
                  Password dimenticata?
                </Link>
              </div>
              <input
                className={inputClass}
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <SubmitButton pendingChildren="Accesso…">Accedi</SubmitButton>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Non hai un account?{" "}
          <Link href="/signup" className="font-semibold text-copper hover:underline">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}
