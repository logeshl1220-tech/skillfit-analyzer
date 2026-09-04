/**
 * SkillFit analysis engine.
 *
 * Primary path: calls a Convex server action that sends the resume + JD
 * to Google Gemini for LLM-powered analysis.
 *
 * Fallback: when the Convex backend is unreachable or the Gemini API key
 * is missing, silently falls back to the local rule-based engine.
 */

import { api } from "../../convex/_generated/api";
import { getConvexClient } from "../convexClient";
import { analyzeJobFit, inferRole, type Analysis } from "../ats";

export type { Analysis };

export async function analyze(input: {
  resume: string;
  jd: string;
  roleHint?: string;
}): Promise<Analysis & { aiPowered: boolean }> {
  const trimmedResume = input.resume.trim();
  const trimmedJd = input.jd.trim();
  const roleHint = input.roleHint ?? inferRole(trimmedJd);

  // --- Try AI path via Convex action -----------------------------------
  try {
    const client = getConvexClient();
    const result = await client.action(api.analyze.analyzeResume, {
      resume: trimmedResume,
      jd: trimmedJd,
      roleHint,
    });

    if (result && typeof result === "object" && "score" in result) {
      return { ...(result as Analysis), aiPowered: true };
    }
    throw new Error("Invalid response shape from analyze action");
  } catch (err) {
    console.warn(
      "[SkillFit] AI analysis unavailable, using local engine:",
      err instanceof Error ? err.message : err,
    );
  }

  // --- Local fallback --------------------------------------------------
  return { ...analyzeJobFit(input), aiPowered: false };
}
