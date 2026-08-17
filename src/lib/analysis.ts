import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

export const MIN_FEEDBACK_FOR_ANALYSIS = 3;
const MAX_FEEDBACK_IN_PROMPT = 150;

export const feedbackAnalysisSchema = z.object({
  summary: z.string().describe("2-3 sentence overview of the overall sentiment across the feedback, in Italian"),
  themes: z
    .array(
      z.object({
        title: z.string().describe("Short theme title, max 5 words, in Italian"),
        description: z
          .string()
          .describe("1-2 sentences explaining the recurring issue or praise behind this theme, in Italian"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe("Impact on the business, weighing both how often it comes up and how serious it is"),
        count: z.number().int().min(1).describe("How many of the given feedback entries relate to this theme"),
        exampleQuote: z
          .string()
          .describe("One short quote taken verbatim from one of the feedback entries, in Italian"),
      }),
    )
    .max(6),
});

export type FeedbackTheme = z.infer<typeof feedbackAnalysisSchema>["themes"][number];
export type FeedbackAnalysisPayload = z.infer<typeof feedbackAnalysisSchema>;

const SYSTEM_PROMPT = `You analyze private customer feedback for a local business in Italy. You'll receive a numbered list of feedback entries, each with its star rating (1-5) and comment text, written in Italian by real customers.

Identify the recurring themes across these comments — group similar complaints or praise together rather than listing each comment separately. For each theme: estimate how many given entries relate to it, judge its severity (low/medium/high) weighing both frequency and how serious the issue is for the business (e.g. hygiene or billing complaints outweigh minor slowness), and pick one short quote that best represents it, copied verbatim from one of the entries.

Write a short overall summary first. All free-text output (summary, theme titles, descriptions, quotes) must be in Italian, matching the source comments. Only report themes actually supported by the given entries — if the feedback is too sparse or varied to find real recurring themes, return fewer themes rather than forcing groupings.`;

export class AnalysisUnavailableError extends Error {}

export async function analyzeFeedback(
  businessName: string,
  entries: { rating: number; comment: string }[],
): Promise<FeedbackAnalysisPayload> {
  if (!client) {
    throw new AnalysisUnavailableError("ANTHROPIC_API_KEY non configurata");
  }

  const sample = entries.slice(0, MAX_FEEDBACK_IN_PROMPT);
  const list = sample.map((f, i) => `${i + 1}. [${f.rating}★] ${f.comment.trim()}`).join("\n");

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Feedback privato per "${businessName}" (${sample.length} voci):\n\n${list}`,
      },
    ],
    output_config: { format: zodOutputFormat(feedbackAnalysisSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("L'analisi non ha prodotto un risultato valido");
  }
  return response.parsed_output;
}
