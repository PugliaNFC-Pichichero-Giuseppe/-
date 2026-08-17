import Link from "next/link";

const steps = [
  {
    n: "01",
    title: "Il cliente tocca l'NFC o inquadra il QR",
    body: "Atterra su una pagina con il tuo nome, i tuoi colori, una domanda sola: \"Com'è andata?\"",
  },
  {
    n: "02",
    title: "Sceglie da 1 a 5 stelle",
    body: "Chi ti dà 4 o 5 stelle viene accompagnato dritto sulla tua scheda Google a scrivere la recensione.",
  },
  {
    n: "03",
    title: "Il resto arriva solo a te",
    body: "Chi non è rimasto soddisfatto lascia un feedback privato che finisce nella tua dashboard, non online.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col px-6">
      <header className="flex items-center justify-between py-8">
        <span className="font-display text-xl font-black uppercase tracking-tight text-cream">
          Recensioni <span className="text-copper">Smart</span>
        </span>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/login" className="text-muted hover:text-cream">
            Accedi
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-copper px-4 py-2 font-semibold text-cream transition hover:bg-copper/90"
          >
            Prova gratis
          </Link>
        </nav>
      </header>

      <section className="flex flex-1 flex-col items-start justify-center py-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-copper">
          Per attività locali — bar, ristoranti, negozi, studi
        </p>
        <h1 className="max-w-2xl font-display text-5xl font-black uppercase leading-[0.98] text-cream sm:text-6xl">
          Le recensioni <em className="text-copper not-italic">belle</em> su Google.
          <br />
          Quelle da <em className="text-copper not-italic">migliorare</em>, da te.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">
          Una pagina intelligente per ogni cliente NFC o QR: raccoglie una valutazione a stelle, manda i clienti
          soddisfatti a scrivere su Google e ti fa arrivare il resto come feedback privato, così puoi rimediare
          prima che diventi una recensione da una stella.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-copper px-6 py-3 font-semibold text-cream transition hover:bg-copper/90"
          >
            Inizia la prova gratuita
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-line px-6 py-3 font-semibold text-cream transition hover:border-copper"
          >
            Ho già un account
          </Link>
        </div>
      </section>

      <section className="grid gap-6 border-t border-line py-16 sm:grid-cols-3">
        {steps.map((step) => (
          <div key={step.n}>
            <span className="font-display text-3xl font-black text-copper">{step.n}</span>
            <h2 className="mt-3 text-base font-semibold text-cream">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-line py-10 text-sm text-muted">
        <p className="max-w-2xl">
          Ogni cliente resta sempre libero di lasciare comunque una recensione pubblica, valutazione bassa
          compresa: non nascondiamo nessuno, incoraggiamo solo i clienti felici a farsi sentire su Google e diamo
          a te per primo la possibilità di rispondere agli altri.
        </p>
      </section>

      <footer className="mt-auto border-t border-line py-8 text-xs text-muted">
        © {new Date().getFullYear()} Recensioni Smart. Fatto in Puglia.
      </footer>
    </div>
  );
}
