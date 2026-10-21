import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";
import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";

// Convex exposes deployment env vars on process.env; the app tsconfig doesn't load Node types.
declare const process: { env: Record<string, string | undefined> };

/**
 * Jev question schema for the Quick log page. One call answers every question in parallel;
 * the client parses quantities, camps and items itself ("Jev decides, code computes").
 */
const questions = {
  intent: choice("What is the relief coordinator trying to do with this text", {
    dispatch: "Sending supplies from the warehouse to a named camp",
    need: "Reporting that a camp is short of or needs a quantity of supplies",
    donation: "Recording money or goods received from a donor",
    assign: "Sending or assigning a named volunteer to a camp",
    stock: "Asking how much of an item is in the warehouse",
    camp: "Asking about one camp's situation, families or status",
    none: "Too short, unclear or unrelated to tell yet",
  }),
  readiness: score("How complete is this input for what the person wants to do", [
    "Just started, key details missing",
    "Partially specified, some details present",
    "Fully specified, ready to act on",
  ]),
  urgency: score("How urgent or time-sensitive the text sounds", [
    "Not urgent at all",
    "Somewhat time-sensitive",
    "Urgent, needs attention immediately",
  ]),
  isQuestion: noul("The text is a question rather than an instruction or statement"),
  isCash: noul("The text is about money rather than physical goods"),
};

const QUESTION_COUNT = Object.keys(questions).length;

function looksLikeKey(key: string | undefined): key is string {
  const k = key?.trim() ?? "";
  return k.length >= 12 && !/\.\.\.|your|xxx|placeholder|changeme|<|>/i.test(k);
}

let client: TypeSafeClient | null = null;

/**
 * Returns `{ mode: "offline" }` when no key is set or the call fails, so the browser
 * falls back to its keyword classifier without flashing an error.
 */
export const classify = action({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    if (!(await ctx.auth.getUserIdentity())) throw new ConvexError("Please sign in first");
    const apiKey = process.env.TYPESAFE_API_KEY;
    if (!looksLikeKey(apiKey)) return { mode: "offline" as const, reason: "TYPESAFE_API_KEY not set" };

    client ??= new TypeSafeClient({
      apiKey,
      defaultModel: process.env.JEV_MODEL || "jev-latest",
      // One fast attempt: a stale answer is worse than falling back offline.
      retry: { maxRetries: 0 },
      timeout: 2500,
    });

    const started = Date.now();
    try {
      const res = await client.systemOne({ state: { text: text.slice(0, 500) }, questions });
      const a = res.answers;
      return {
        mode: "online" as const,
        intent: { value: a.intent.choice, confidence: a.intent.confidence, probabilities: { ...a.intent.probabilities } },
        readiness: a.readiness.score,
        urgency: a.urgency.score,
        isQuestion: a.isQuestion.noul,
        isCash: a.isCash.noul,
        latencyMs: Date.now() - started,
        questionCount: QUESTION_COUNT,
        model: res.model,
      };
    } catch (err) {
      console.warn(`[jev] call failed: ${err instanceof Error ? err.message : String(err)}`);
      return { mode: "offline" as const, reason: "Jev call failed" };
    }
  },
});
