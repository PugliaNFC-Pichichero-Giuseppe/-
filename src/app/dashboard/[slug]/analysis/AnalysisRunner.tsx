"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/form";
import type { AnalysisFormState } from "../../actions";

export function AnalysisRunner({
  action,
  hasAnalysis,
}: {
  action: (prevState: AnalysisFormState, formData: FormData) => Promise<AnalysisFormState>;
  hasAnalysis: boolean;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="shrink-0 text-right">
      <SubmitButton
        pendingChildren="Analizzo…"
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {hasAnalysis ? "Rigenera analisi" : "Genera analisi"}
      </SubmitButton>
      {state.error && <p className="mt-2 max-w-xs text-xs text-danger">{state.error}</p>}
    </form>
  );
}
