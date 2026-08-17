"use client";

import { useState } from "react";
import Script from "next/script";
import { submitFeedbackAction, submitRatingAction } from "./actions";
import { inputClass, labelClass } from "@/components/form";

type Business = {
  id: string;
  slug: string;
  name: string;
  googleReviewUrl: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  phone: string | null;
  ratingThreshold: number;
  primaryColor: string;
  accentColor: string;
  gaMeasurementId: string | null;
};

type Phase = "rate" | "submitting" | "redirecting" | "feedback" | "feedback-submitting" | "done" | "error";

function trackEvent(gaId: string | null, name: string, params: Record<string, unknown>) {
  if (!gaId) return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag === "function") w.gtag("event", name, params);
}

function Star({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-9 w-9 sm:h-10 sm:w-10"
      fill={active ? "var(--biz-accent)" : "none"}
      stroke={active ? "var(--biz-accent)" : "var(--muted)"}
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2.75l2.79 6.62 7.15.62-5.43 4.71 1.64 6.98L12 17.98l-6.15 3.7 1.64-6.98-5.43-4.71 7.15-.62L12 2.75z"
      />
    </svg>
  );
}

export function GateWidget({ business, channel }: { business: Business; channel: "nfc" | "qr" | "direct" }) {
  const [phase, setPhase] = useState<Phase>("rate");
  const [hovered, setHovered] = useState(0);
  const [rating, setRating] = useState(0);
  const [reviewEventId, setReviewEventId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [comment, setComment] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const style = {
    "--biz-primary": business.primaryColor,
    "--biz-accent": business.accentColor,
  } as React.CSSProperties;

  async function handleRate(value: number) {
    if (phase !== "rate") return;
    setRating(value);
    setPhase("submitting");

    const result = await submitRatingAction({ slug: business.slug, rating: value, channel });

    if (!result.ok) {
      setErrorMsg(result.error);
      setPhase("error");
      return;
    }

    setReviewEventId(result.reviewEventId);
    trackEvent(business.gaMeasurementId, "rating_submitted", {
      client_name: business.slug,
      channel,
      rating: value,
      redirected: result.redirected,
    });

    if (result.redirected) {
      setPhase("redirecting");
      window.setTimeout(() => {
        window.location.href = result.googleReviewUrl;
      }, 1100);
    } else {
      setPhase("feedback");
    }
  }

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewEventId) return;
    setPhase("feedback-submitting");

    const result = await submitFeedbackAction({
      reviewEventId,
      comment,
      contactName,
      contactInfo,
    });

    if (!result.ok) {
      setErrorMsg(result.error);
      setPhase("error");
      return;
    }

    setPhase("done");
  }

  return (
    <div className="flex min-h-svh justify-center px-5 py-14" style={style}>
      {business.gaMeasurementId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${business.gaMeasurementId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${business.gaMeasurementId}');
              gtag('event', 'scan_redirect', { client_name: '${business.slug}', channel: '${channel}' });`}
          </Script>
        </>
      )}

      <div className="flex w-full max-w-md flex-col">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-muted">{business.name}</p>

        {phase === "rate" || phase === "submitting" ? (
          <>
            <h1 className="mt-6 text-center font-display text-4xl font-black uppercase leading-none text-cream sm:text-5xl">
              Com&apos;è andata?
            </h1>
            <p className="mt-3 text-center text-sm text-muted">Tocca le stelle per lasciarci una valutazione.</p>

            <div
              className="mt-10 flex justify-center gap-2"
              onMouseLeave={() => setHovered(0)}
              role="radiogroup"
              aria-label="Valutazione da 1 a 5 stelle"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} stelle`}
                  disabled={phase === "submitting"}
                  className="p-1 transition active:scale-90 disabled:cursor-wait"
                  onMouseEnter={() => setHovered(value)}
                  onClick={() => handleRate(value)}
                >
                  <Star active={value <= (hovered || rating)} />
                </button>
              ))}
            </div>
          </>
        ) : null}

        {phase === "redirecting" && (
          <div className="mt-16 text-center">
            <p className="font-display text-3xl font-black uppercase text-cream">Grazie!</p>
            <p className="mt-3 text-sm text-muted">Ti portiamo su Google a scrivere la tua recensione…</p>
          </div>
        )}

        {(phase === "feedback" || phase === "feedback-submitting") && (
          <form onSubmit={handleFeedbackSubmit} className="mt-10">
            <p className="text-center text-sm text-muted">
              Ci dispiace non essere stati all&apos;altezza. Raccontaci cosa possiamo migliorare — lo leggiamo noi,
              in privato.
            </p>
            <div className="mt-6">
              <label className={labelClass} htmlFor="comment">
                Il tuo feedback
              </label>
              <textarea
                id="comment"
                required
                rows={4}
                className={inputClass}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Cosa possiamo fare meglio?"
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="contactName">
                  Nome (opzionale)
                </label>
                <input
                  id="contactName"
                  className={inputClass}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="contactInfo">
                  Telefono/email (opz.)
                </label>
                <input
                  id="contactInfo"
                  className={inputClass}
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6">
              <FeedbackSubmitButton pending={phase === "feedback-submitting"} />
            </div>
            <a
              href={business.googleReviewUrl}
              target="_blank"
              rel="noopener"
              className="mt-4 block text-center text-xs text-muted underline decoration-dotted hover:text-cream"
            >
              Preferisci comunque lasciare una recensione pubblica su Google?
            </a>
          </form>
        )}

        {phase === "done" && (
          <div className="mt-16 text-center">
            <p className="font-display text-3xl font-black uppercase text-cream">Grazie del tempo</p>
            <p className="mt-3 text-sm text-muted">Il tuo feedback è arrivato al titolare, in privato.</p>
            <a
              href={business.googleReviewUrl}
              target="_blank"
              rel="noopener"
              className="mt-6 inline-block text-xs text-muted underline decoration-dotted hover:text-cream"
            >
              Vuoi lasciare comunque una recensione pubblica su Google?
            </a>
          </div>
        )}

        {phase === "error" && (
          <div className="mt-16 text-center">
            <p className="text-danger">{errorMsg || "Qualcosa è andato storto."}</p>
            <button
              type="button"
              onClick={() => {
                setPhase("rate");
                setRating(0);
              }}
              className="mt-4 rounded-lg border border-line px-4 py-2 text-sm text-cream hover:border-[var(--biz-primary)]"
            >
              Riprova
            </button>
          </div>
        )}

        {(business.instagramUrl || business.facebookUrl || business.phone) && phase === "rate" && (
          <nav className="mt-16 border-t border-line">
            {business.instagramUrl && (
              <a
                className="flex items-center justify-between border-b border-line py-5 text-cream"
                href={business.instagramUrl}
                target="_blank"
                rel="noopener"
              >
                <span className="text-sm font-semibold">Seguici su Instagram</span>
                <span aria-hidden>→</span>
              </a>
            )}
            {business.facebookUrl && (
              <a
                className="flex items-center justify-between border-b border-line py-5 text-cream"
                href={business.facebookUrl}
                target="_blank"
                rel="noopener"
              >
                <span className="text-sm font-semibold">Seguici su Facebook</span>
                <span aria-hidden>→</span>
              </a>
            )}
            {business.phone && (
              <a className="flex items-center justify-between py-5 text-cream" href={`tel:${business.phone}`}>
                <span className="text-sm font-semibold">Chiamaci</span>
                <span aria-hidden>→</span>
              </a>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}

// This form submits via onSubmit (not <form action={serverAction}>), so
// react-dom's useFormStatus wouldn't see it — plain pending state instead.
// The --biz-primary custom property is inherited from the wrapping div.
function FeedbackSubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      style={{ backgroundColor: "var(--biz-primary)" }}
      className="w-full rounded-lg px-4 py-3 font-semibold text-cream transition disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Invio…" : "Invia feedback"}
    </button>
  );
}
