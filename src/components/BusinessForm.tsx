"use client";

import { useActionState } from "react";
import { FormError, SubmitButton, inputClass, labelClass } from "@/components/form";
import type { BusinessFormState } from "@/app/dashboard/actions";

type Defaults = {
  name?: string;
  googleReviewUrl?: string;
  instagramUrl?: string;
  phone?: string;
  ratingThreshold?: number;
  primaryColor?: string;
  accentColor?: string;
  gaMeasurementId?: string;
};

export function BusinessForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (prevState: BusinessFormState, formData: FormData) => Promise<BusinessFormState>;
  defaults?: Defaults;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state.error} />

      <div>
        <label className={labelClass} htmlFor="name">
          Nome attività
        </label>
        <input
          id="name"
          name="name"
          className={inputClass}
          defaultValue={defaults?.name}
          placeholder="Es. Vulpes Pop Bistrot"
          required
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="googleReviewUrl">
          Link recensione Google
        </label>
        <input
          id="googleReviewUrl"
          name="googleReviewUrl"
          type="url"
          className={inputClass}
          defaultValue={defaults?.googleReviewUrl}
          placeholder="https://www.google.com/maps/search/?api=1&query=..."
          required
        />
        <p className="mt-2 text-xs text-muted">
          Su Google Maps cerca la tua attività → &quot;Scrivi una recensione&quot; → copia il link dalla barra
          degli indirizzi.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="ratingThreshold">
          Soglia per Google
        </label>
        <select
          id="ratingThreshold"
          name="ratingThreshold"
          className={inputClass}
          defaultValue={defaults?.ratingThreshold ?? 4}
        >
          {[3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} stelle o più
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-muted">
          Chi vota da questa soglia in su viene accompagnato su Google. Gli altri restano nel tuo feedback
          privato — e possono comunque scegliere di lasciare una recensione pubblica se lo vogliono.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="primaryColor">
            Colore principale
          </label>
          <input
            id="primaryColor"
            name="primaryColor"
            type="color"
            defaultValue={defaults?.primaryColor ?? "#C1602E"}
            className="h-12 w-full rounded-lg border border-line bg-surface"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="accentColor">
            Colore stelle
          </label>
          <input
            id="accentColor"
            name="accentColor"
            type="color"
            defaultValue={defaults?.accentColor ?? "#E8A94A"}
            className="h-12 w-full rounded-lg border border-line bg-surface"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="instagramUrl">
            Instagram (opzionale)
          </label>
          <input
            id="instagramUrl"
            name="instagramUrl"
            type="url"
            className={inputClass}
            defaultValue={defaults?.instagramUrl}
            placeholder="https://instagram.com/..."
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="phone">
            Telefono (opzionale)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className={inputClass}
            defaultValue={defaults?.phone}
            placeholder="+39 080 ..."
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="gaMeasurementId">
          Google Analytics (opzionale)
        </label>
        <input
          id="gaMeasurementId"
          name="gaMeasurementId"
          className={inputClass}
          defaultValue={defaults?.gaMeasurementId}
          placeholder="G-XXXXXXXXXX"
        />
      </div>

      <SubmitButton pendingChildren="Salvataggio…">{submitLabel}</SubmitButton>
    </form>
  );
}
