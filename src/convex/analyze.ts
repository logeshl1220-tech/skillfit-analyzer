"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `You are SkillFit, an expert ATS resume analyzer. Given a resume and a job description, produce a JSON analysis evaluating how well the resume fits the role.

Return ONLY valid JSON (no markdown fences) matching this exact schema:

{
  "score": <number 0-100>,
  "rating": "<High Match|Good Fit|Needs Work>",
  "tone": "<high|mid|low>  (high ≥ 80, mid ≥ 60, low < 60>",
  "roleLabel": "<inferred role title>",
  "signals": [
    { "id": "keywords", "label": "Keyword match", "value": <0-100>, "caption": "<one sentence>" },
    { "id": "structure", "label": "Resume structure", "value": <0-100>, "caption": "<one sentence>" },
    { "id": "impact", "label": "Impact language", "value": <0-100>, "caption": "<one sentence>" },
    { "id": "hygiene", "label": "Formatting hygiene", "value": <0-100>, "caption": "<one sentence>" }
  ],
  "coveragePct": <0-100>,
  "matchedSkills": ["<skill1>", ...],
  "missingSkills": ["<skill1>", ...],
  "bulletTips": [
    {
      "skill": "<skill>",
      "original": "<original bullet or null>",
      "situation": "<STAR: Situation>",
      "task": "<STAR: Task>",
      "action": "<STAR: Action>",
      "result": "<STAR: Result>"
    }
  ],
  "questions": [
    { "type": "<Technical|Behavioral|Role Fit>", "question": "<question text>", "why": "<why this question>" }
  ]
}

Guidelines:
- Score is holistic: keyword match (~45%), structure (~20%), impact language (~20%), formatting (~15%).
- matchedSkills: skills/technologies from the JD that appear in the resume.
- missingSkills: required JD skills NOT found in the resume.
- coveragePct: percentage of JD-required skills found in resume.
- bulletTips: exactly 3 STAR rewrites. Use actual lines from the resume as "original" when possible. Each targets a different skill.
- questions: exactly 5 interview questions. Mix Technical (2-3), Behavioral (1-2), Role Fit (1). Each "why" explains the interviewer's intent.
- roleLabel: infer the target role from the JD (e.g., "Full-Stack Developer", "Data Analyst", "React Intern").
- Keep all text concise — no more than 2 sentences per caption/why field.`;

export const analyzeResume = action({
  args: {
    resume: v.string(),
    jd: v.string(),
    roleHint: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not configured. Add it to your Convex environment variables.",
      );
    }

    const userMessage = [
      args.roleHint
        ? `Target role hint: ${args.roleHint}\n`
        : "",
      "=== RESUME ===",
      args.resume,
      "",
      "=== JOB DESCRIPTION ===",
      args.jd,
    ].join("\n");

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: {
          temperature: 0.4,
          topP: 0.95,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Gemini API error ${response.status}: ${body.slice(0, 300)}`,
      );
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    // Parse the JSON — Gemini may occasionally wrap in markdown fences.
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(cleaned);

    // Validate and normalize to our expected shape.
    const score = clamp(parsed.score, 0, 100);
    const tone: "high" | "mid" | "low" =
      score >= 80 ? "high" : score >= 60 ? "mid" : "low";

    return {
      score,
      rating: clampRating(parsed.rating, tone),
      tone,
      roleLabel: String(parsed.roleLabel || "Software Engineer"),
      signals: normalizeSignals(parsed.signals),
      coveragePct: clamp(parsed.coveragePct, 0, 100),
      matchedSkills: toStringArray(parsed.matchedSkills),
      missingSkills: toStringArray(parsed.missingSkills),
      bulletTips: normalizeBulletTips(parsed.bulletTips),
      questions: normalizeQuestions(parsed.questions),
    };
  },
});

/* ------------------------------------------------------------------ */
/* Response normalizers                                                */
/* ------------------------------------------------------------------ */

function clamp(v: unknown, min: number, max: number): number {
  const n = typeof v === "number" ? v : 0;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function clampRating(raw: unknown, tone: "high" | "mid" | "low"): string {
  if (typeof raw === "string" && raw.length > 0) return raw;
  return tone === "high"
    ? "High Match"
    : tone === "mid"
      ? "Good Fit"
      : "Needs Work";
}

function toStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((s): s is string => typeof s === "string" && s.length > 0);
}

const SIGNAL_DEFAULTS: Record<string, { label: string; caption: string }> = {
  keywords: { label: "Keyword match", caption: "Keyword coverage analysis" },
  structure: { label: "Resume structure", caption: "Section completeness check" },
  impact: { label: "Impact language", caption: "Action verbs and metrics analysis" },
  hygiene: { label: "Formatting hygiene", caption: "Layout and readability check" },
};

function normalizeSignals(raw: unknown): Array<{
  id: string;
  label: string;
  value: number;
  caption: string;
}> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (s): s is { id: string; value: number } =>
        typeof s === "object" &&
        s !== null &&
        typeof (s as Record<string, unknown>).id === "string" &&
        typeof (s as Record<string, unknown>).value === "number",
    )
    .map((s) => ({
      id: s.id,
      label: SIGNAL_DEFAULTS[s.id]?.label ?? s.id,
      value: clamp(s.value, 0, 100),
      caption:
        typeof (s as Record<string, unknown>).caption === "string"
          ? ((s as Record<string, unknown>).caption as string)
          : SIGNAL_DEFAULTS[s.id]?.caption ?? "",
    }));
}

function normalizeBulletTips(raw: unknown): Array<{
  skill: string;
  original: string | null;
  situation: string;
  task: string;
  action: string;
  result: string;
}> {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 3).map((t) => {
    const tip = (typeof t === "object" && t !== null ? t : {}) as Record<
      string,
      unknown
    >;
    return {
      skill: String(tip.skill || "Communication"),
      original: typeof tip.original === "string" ? tip.original : null,
      situation: String(tip.situation || ""),
      task: String(tip.task || ""),
      action: String(tip.action || ""),
      result: String(tip.result || ""),
    };
  });
}

function normalizeQuestions(raw: unknown): Array<{
  type: "Technical" | "Behavioral" | "Role Fit";
  question: string;
  why: string;
}> {
  if (!Array.isArray(raw)) return [];
  const validTypes = new Set(["Technical", "Behavioral", "Role Fit"]);
  return raw.slice(0, 5).map((q) => {
    const item = (typeof q === "object" && q !== null ? q : {}) as Record<
      string,
      unknown
    >;
    const typeStr = String(item.type || "Technical");
    return {
      type: validTypes.has(typeStr)
        ? (typeStr as "Technical" | "Behavioral" | "Role Fit")
        : "Technical",
      question: String(item.question || ""),
      why: String(item.why || ""),
    };
  });
}
