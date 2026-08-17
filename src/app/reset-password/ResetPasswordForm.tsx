"use client";

import { useActionState } from "react";
import { resetPasswordAction, type ResetPasswordState } from "./actions";
import { FormError, SubmitButton, inputClass, labelClass } from "@/components/form";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <FormError message={state.error} />
      <div>
        <label className={labelClass} htmlFor="password">
          Nuova password
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
      </div>
      <SubmitButton pendingChildren="Salvataggio…">Imposta nuova password</SubmitButton>
    </form>
  );
}
