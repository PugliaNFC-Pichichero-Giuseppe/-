import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAccessibleBusiness } from "@/lib/business";
import { prisma } from "@/lib/db";
import { MIN_FEEDBACK_FOR_ANALYSIS, type FeedbackTheme } from "@/lib/analysis";
import { BusinessNav } from "@/components/BusinessNav";
import { runFeedbackAnalysisAction } from "../../actions";
import { AnalysisRunner } from "./AnalysisRunner";

// The Claude API call this page's action makes can take longer than the
// platform's default Server Action timeout.
export const maxDuration = 60;

type Props = { params: Promise<{ slug: string }> };

const SEVERITY_LABEL: Record<string, string> = { low: "Bassa", medium: "Media", high: "Alta" };
const SEVERITY_CLASS: Record<string, string> = {
  low: "bg-success/15 text-success",
  medium: "bg-amber/15 text-copper",
  high: "bg-danger/15 text-danger",
};

export default async function FeedbackAnalysisPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await getAccessibleBusiness(slug, user.id);
  if (!business) notFound();

  const [analysis, feedbackCount] = await Promise.all([
    prisma.feedbackAnalysis.findUnique({ where: { businessId: business.id } }),
    prisma.feedback.count({ where: { businessId: business.id } }),
  ]);

  const themes = (analysis?.themes as FeedbackTheme[] | undefined) ?? [];
  const newSinceAnalysis = analysis ? feedbackCount - analysis.feedbackCount : 0;
  const runAction = runFeedbackAnalysisAction.bind(null, business.slug);

  return (
    <div>
      <BusinessNav slug={business.slug} name={business.name} active="analysis" isOwner={business.isOwner} />

      {feedbackCount < MIN_FEEDBACK_FOR_ANALYSIS ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-lg font-semibold text-cream">Ancora troppo pochi feedback</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Servono almeno {MIN_FEEDBACK_FOR_ANALYSIS} feedback privati per generare un&apos;analisi utile — al
            momento ce ne {feedbackCount === 1 ? "è" : "sono"} {feedbackCount}.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-cream">Analisi automatica</h2>
                <p className="mt-1 text-xs text-muted">
                  {analysis
                    ? `Generata il ${analysis.generatedAt.toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })} su ${analysis.feedbackCount} feedback.`
                    : "Raggruppa i feedback privati nei temi ricorrenti, con l'AI di Claude."}
                </p>
              </div>
              <AnalysisRunner action={runAction} hasAnalysis={!!analysis} />
            </div>
            {analysis && newSinceAnalysis > 0 && (
              <p className="mt-4 rounded-lg bg-bg px-3 py-2 text-xs text-muted">
                {newSinceAnalysis} nuov{newSinceAnalysis > 1 ? "i" : "o"} feedback da quando hai generato questa
                analisi — rigenerala per includerli.
              </p>
            )}
          </div>

          {analysis && (
            <>
              <div className="rounded-2xl border border-line bg-surface p-6">
                <h2 className="text-sm font-semibold text-cream">Riepilogo</h2>
                <p className="mt-3 text-sm text-cream">{analysis.summary}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {themes.map((theme, i) => (
                  <div key={i} className="rounded-2xl border border-line bg-surface p-6">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-cream">{theme.title}</h3>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          SEVERITY_CLASS[theme.severity] ?? "bg-line text-muted"
                        }`}
                      >
                        {SEVERITY_LABEL[theme.severity] ?? theme.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted">{theme.count} feedback</p>
                    <p className="mt-3 text-sm text-cream">{theme.description}</p>
                    <p className="mt-3 border-l-2 border-line pl-3 text-sm italic text-muted">
                      &quot;{theme.exampleQuote}&quot;
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
