"use client";

import { useActionState } from "react";
import { FormError, SubmitButton, inputClass, labelClass } from "@/components/form";
import type { TeamFormState } from "../../actions";

export function AddTeamMemberForm({
  action,
}: {
  action: (prevState: TeamFormState, formData: FormData) => Promise<TeamFormState>;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />
      <div>
        <label className={labelClass} htmlFor="email">
          Email del collega
        </label>
        <input id="email" name="email" type="email" className={inputClass} placeholder="nome@esempio.it" required />
      </div>
      <SubmitButton pendingChildren="Aggiungo…">Aggiungi</SubmitButton>
    </form>
  );
}
