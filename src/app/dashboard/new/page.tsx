import { BusinessForm } from "@/components/BusinessForm";
import { createBusinessAction } from "../actions";

export default function NewBusinessPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold text-cream">Aggiungi un&apos;attività</h1>
      <p className="mt-2 text-sm text-muted">
        Crea la pagina che i tuoi clienti vedranno toccando la card NFC o inquadrando il QR.
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-surface p-8">
        <BusinessForm action={createBusinessAction} submitLabel="Crea attività" />
      </div>
    </div>
  );
}
