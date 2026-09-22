/**
 * SkillFit analysis engine.
 *
 * Primary path: calls a Convex server action that sends the resume + JD
 * to Google Gemini for LLM-powered analysis (score, skills, STAR bullets,
 * interview questions) plus a structured parse of the resume itself.
 *
 * Fallback: when the Convex backend is unreachable or the Gemini API key
 * is missing, silently falls back to the local rule-based engine and a
 * heuristic resume parser.
 */

import { api } from "../../convex/_generated/api";
import { getConvexClient } from "../convexClient";
import {
  analyzeJobFit,
  inferRole,
  localCoverLetter,
  parseResume,
  type Analysis,
  type CoverLetterDraft,
  type ParsedResume,
} from "../ats";

export type { Analysis, CoverLetterDraft };

export interface SkillFitResult extends Analysis {
  aiPowered: boolean;
  /** Structured resume data used by the tailored-resume PDF export. */
  resume: ParsedResume;
}

export async function analyze(input: {
  resume: string;
  jd: string;
  roleHint?: string;
}): Promise<SkillFitResult> {
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
      const ai = result as Analysis & { resume?: ParsedResume | null };
      return {
        ...ai,
        aiPowered: true,
        resume: ai.resume ?? parseResume(trimmedResume),
      };
    }
    throw new Error("Invalid response shape from analyze action");
  } catch (err) {
    console.warn(
      "[SkillFit] AI analysis unavailable, using local engine:",
      err instanceof Error ? err.message : err,
    );
  }

  // --- Local fallback --------------------------------------------------
  return {
    ...analyzeJobFit(input),
    aiPowered: false,
    resume: parseResume(trimmedResume),
  };
}

/**
 * Draft a tailored cover letter. Tries the Gemini-backed Convex action
 * first; falls back to the deterministic local composer so the feature
 * still produces a usable letter without an API key.
 */
export async function generateCoverLetter(input: {
  resumeText: string;
  jd: string;
  roleHint?: string;
  resume: ParsedResume;
}): Promise<CoverLetterDraft> {
  const roleHint = input.roleHint ?? inferRole(input.jd);
  try {
    const client = getConvexClient();
    const result = await client.action(api.analyze.generateCoverLetter, {
      resumeText: input.resumeText,
      jd: input.jd,
      roleHint,
      resume: input.resume,
    });
    if (
      result &&
      typeof result === "object" &&
      Array.isArray((result as CoverLetterDraft).paragraphs) &&
      (result as CoverLetterDraft).paragraphs.length > 0
    ) {
      return result as CoverLetterDraft;
    }
    throw new Error("Invalid response shape from generateCoverLetter action");
  } catch (err) {
    console.warn(
      "[SkillFit] AI cover letter unavailable, using local composer:",
      err instanceof Error ? err.message : err,
    );
  }
  return localCoverLetter({
    ...(analyzeJobFit({
      resume: input.resumeText,
      jd: input.jd,
      roleHint,
    }) as Analysis),
    roleLabel: roleHint,
  });
}