/**
 * SkillFit — ATS-friendly, single-page "tailored resume" PDF generator.
 *
 * Client-side only (jsPDF). Merges:
 *  - the candidate's parsed resume data (contact, education, experience, projects)
 *  - AI-generated STAR bullets in place of matched weak bullets
 *  - matched skills folded into the Skills section
 *
 * Layout: clean single column, Helvetica, 0.6" margins, black/grey on white —
 * the classic ATS-safe profile. If content overflows one page, the document is
 * rebuilt at progressively smaller type until it fits (min 8pt).
 */

import { jsPDF } from "jspdf";
import type { Analysis, BulletTip, ParsedResume, ResumeEntry } from "../ats";

/* ------------------------------------------------------------------ */
/* Layout constants (US Letter, 0.6" margins)                          */
/* ------------------------------------------------------------------ */

const PAGE_W = 612; // 8.5"
const PAGE_H = 792; // 11"
const MARGIN = 43.2; // 0.6"
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = "#111827";
const INK_MUTED = "#4b5563";
const RULE = "#cbd5e1";

const SECTION_GAP = 13;
const ENTRY_GAP = 10;
const BULLET_GAP = 5;

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

/** jsPDF standard fonts only cover WinAnsi — drop exotic glyphs. */
function sanitize(s: string): string {
  return s
    .replace(
      /[^\x20-\x7E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u00B7\u2026]/g,
      "",
    )
    .replace(/\u00A0/g, " ")
    .trim();
}

function capFirst(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Strip coaching labels ("Situation — ", "Action: ", "S — ") from a STAR fragment. */
function cleanFragment(s: string): string {
  return s
    .replace(/^(Situation|Task|Action|Result)\s*[:\-—–]\s*/i, "")
    .replace(/^(S|T|A|R)\s*[:\-—–]\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.\s]+$/, "");
}

/**
 * Situation fragment for the composed bullet. The local rule engine wraps a
 * weak line in coaching prose ("you took on <line> in a project…") — recover
 * the candidate's own wording for the PDF when that wrapper is detected.
 */
function situationText(tip: BulletTip): string {
  const frag = cleanFragment(tip.situation);
  const wrapped = frag.match(
    /^(?:you\s+)?took on\s+(.+?)\s+in a project or internship where the team needed a reliable owner\.?$/i,
  );
  if (wrapped && tip.original) {
    const raw = capFirst(cleanFragment(tip.original));
    if (raw) return raw;
  }
  return frag;
}

/** Collapse a STAR tip into a single resume-ready bullet. */
export function composeStarBullet(tip: BulletTip): string {
  const parts = [
    tip.situation ? `S: ${situationText(tip)}` : "",
    tip.task ? `T: ${capFirst(cleanFragment(tip.task))}` : "",
    tip.action ? `A: ${capFirst(cleanFragment(tip.action))}` : "",
    tip.result ? `R: ${capFirst(cleanFragment(tip.result))}` : "",
  ].filter((p) => p.length > 3);
  if (parts.length === 0) return "";
  return `${parts.join("  ")}.`;
}

function normLine(s: string): string {
  return s
    .replace(/^[\s•\-*▪‣>]+/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?]+$/, "");
}

/** resume.skills ∪ analysis.matchedSkills — so the PDF passes ATS keyword scans. */
function mergeSkills(resume: ParsedResume, analysis: Analysis): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [...resume.skills, ...analysis.matchedSkills]) {
    const skill = raw.trim();
    const key = skill.toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(skill);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Document builder                                                    */
/* ------------------------------------------------------------------ */

interface DocCtx {
  doc: jsPDF;
  y: number;
  bodySize: number;
  allowOverflow: boolean;
}

function lineH(size: number): number {
  return Math.round(size * 1.34);
}

function wrapped(doc: jsPDF, text: string, width: number, size: number): string[] {
  doc.setFontSize(size);
  return doc.splitTextToSize(text, width) as string[];
}

function drawText(
  ctx: DocCtx,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  opts?: {
    align?: "left" | "center" | "right";
    style?: "normal" | "bold" | "italic";
  },
): void {
  ctx.doc.setFont("helvetica", opts?.style ?? "normal");
  ctx.doc.setFontSize(size);
  ctx.doc.setTextColor(color);
  ctx.doc.text(
    sanitize(text),
    x,
    y,
    opts?.align ? { align: opts.align } : undefined,
  );
}

function canFit(ctx: DocCtx, height: number): boolean {
  return ctx.allowOverflow || ctx.y + height <= PAGE_H - MARGIN;
}

/** Uppercase section title + rule. Returns false when it can't fit. */
function sectionHeader(ctx: DocCtx, title: string): boolean {
  const titleSize = ctx.bodySize + 1.5;
  const h = lineH(titleSize) + 7;
  if (!canFit(ctx, SECTION_GAP + h)) return false;
  ctx.y += SECTION_GAP;
  drawText(ctx, title.toUpperCase(), MARGIN, ctx.y, titleSize, INK, {
    style: "bold",
  });
  ctx.doc.setDrawColor(RULE);
  ctx.doc.setLineWidth(0.7);
  ctx.doc.line(MARGIN, ctx.y + 3.5, PAGE_W - MARGIN, ctx.y + 3.5);
  ctx.y += h;
  return true;
}

/** Bulleted lines with a hanging indent. Returns false when it can't fit. */
function drawBullets(ctx: DocCtx, bullets: string[]): boolean {
  const bX = MARGIN + 8;
  const tX = MARGIN + 20;
  const width = CONTENT_W - 24;
  for (const raw of bullets) {
    const text = sanitize(raw);
    if (!text) continue;
    const lines = wrapped(ctx.doc, text, width, ctx.bodySize);
    const h = lines.length * lineH(ctx.bodySize);
    if (!canFit(ctx, h + BULLET_GAP)) return false;
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(ctx.bodySize);
    ctx.doc.setTextColor(INK);
    ctx.doc.text("•", bX, ctx.y);
    lines.forEach((ln, i) => {
      ctx.doc.text(ln, tX, ctx.y + i * lineH(ctx.bodySize));
    });
    ctx.y += h + BULLET_GAP;
  }
  return true;
}

/**
 * One entry (title / subtitle / dates + bullets). With `plainDetails` the
 * detail lines render without bullet markers (used for Education).
 */
function drawEntry(
  ctx: DocCtx,
  entry: ResumeEntry,
  bullets: string[],
  plainDetails = false,
): boolean {
  const titleSize = ctx.bodySize + 1;
  const subtitleSize = ctx.bodySize - 0.5;

  if (plainDetails) {
    const detailH = bullets.reduce((acc, d) => {
      const lines = wrapped(ctx.doc, d, CONTENT_W, ctx.bodySize);
      return acc + lines.length * lineH(ctx.bodySize);
    }, 0);
    const h =
      lineH(titleSize) + (entry.subtitle ? lineH(subtitleSize) : 0) + detailH;
    if (!canFit(ctx, h)) return false;

    drawText(ctx, entry.title, MARGIN, ctx.y, titleSize, INK, {
      style: "bold",
    });
    if (entry.dates) {
      drawText(ctx, entry.dates, PAGE_W - MARGIN, ctx.y, ctx.bodySize, INK_MUTED, {
        align: "right",
      });
    }
    ctx.y += lineH(titleSize);
    if (entry.subtitle) {
      drawText(ctx, entry.subtitle, MARGIN, ctx.y, subtitleSize, INK_MUTED, {
        style: "italic",
      });
      ctx.y += lineH(subtitleSize);
    }
    for (const d of bullets) {
      const lines = wrapped(ctx.doc, d, CONTENT_W, ctx.bodySize);
      lines.forEach((ln, i) => {
        drawText(ctx, ln, MARGIN, ctx.y + i * lineH(ctx.bodySize), ctx.bodySize, INK);
      });
      ctx.y += lines.length * lineH(ctx.bodySize);
    }
    return true;
  }

  const h =
    lineH(titleSize) + (entry.subtitle ? lineH(subtitleSize) : 0);
  if (!canFit(ctx, h)) return false;

  drawText(ctx, entry.title, MARGIN, ctx.y, titleSize, INK, {
    style: "bold",
  });
  if (entry.dates) {
    drawText(ctx, entry.dates, PAGE_W - MARGIN, ctx.y, ctx.bodySize, INK_MUTED, {
      align: "right",
    });
  }
  ctx.y += lineH(titleSize);
  if (entry.subtitle) {
    drawText(ctx, entry.subtitle, MARGIN, ctx.y, subtitleSize, INK_MUTED, {
      style: "italic",
    });
    ctx.y += lineH(subtitleSize);
  }
  return bullets.length > 0 ? drawBullets(ctx, bullets) : true;
}

function buildDoc(
  resume: ParsedResume,
  analysis: Analysis,
  bodySize: number,
  allowOverflow: boolean,
): jsPDF | null {
  const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
  const ctx: DocCtx = { doc, y: MARGIN, bodySize, allowOverflow };

  /* ---- Header: name + contact -------------------------------------- */
  const name = sanitize(resume.name) || "Candidate Resume";
  const contact = resume.contact.map(sanitize).filter(Boolean).join("  ·  ");
  const headH =
    lineH(bodySize + 7) + (contact ? lineH(bodySize - 1) : 0) + 12;
  if (!canFit(ctx, headH)) return null;

  drawText(ctx, name, PAGE_W / 2, ctx.y, bodySize + 7, INK, {
    align: "center",
    style: "bold",
  });
  ctx.y += lineH(bodySize + 7);
  if (contact) {
    drawText(ctx, contact, PAGE_W / 2, ctx.y, bodySize - 1, INK_MUTED, {
      align: "center",
    });
    ctx.y += lineH(bodySize - 1);
  }
  ctx.y += 5;
  ctx.doc.setDrawColor(RULE);
  ctx.doc.setLineWidth(0.9);
  ctx.doc.line(MARGIN, ctx.y, PAGE_W - MARGIN, ctx.y);
  ctx.y += 5;

  /* ---- STAR tips pool ---------------------------------------------- */
  const tips = [...analysis.bulletTips];
  const tipFor = (bullet: string): BulletTip | null => {
    const n = normLine(bullet);
    const idx = tips.findIndex(
      (t) => t.original && normLine(t.original) === n,
    );
    if (idx === -1) return null;
    const [tip] = tips.splice(idx, 1);
    return tip;
  };
  // Suggestions with no original line get appended to the first entry.
  const extraBullets = analysis.bulletTips
    .filter((t) => !t.original)
    .map(composeStarBullet)
    .filter(Boolean);

  /* ---- Summary ------------------------------------------------------ */
  if (resume.summary.length > 0) {
    if (!sectionHeader(ctx, "Summary")) return null;
    const summaryText = sanitize(resume.summary.join(" ")).slice(0, 700);
    const lines = wrapped(ctx.doc, summaryText, CONTENT_W, ctx.bodySize);
    const h = lines.length * lineH(ctx.bodySize);
    if (!canFit(ctx, h + 6)) return null;
    drawText(ctx, summaryText, MARGIN, ctx.y, ctx.bodySize, INK);
    ctx.y += h + 6;
  }

  /* ---- Skills (original + matched keywords) ------------------------- */
  const skills = mergeSkills(resume, analysis);
  if (skills.length > 0) {
    if (!sectionHeader(ctx, "Skills")) return null;
    const skillsText = skills.join(", ");
    const lines = wrapped(ctx.doc, skillsText, CONTENT_W, ctx.bodySize);
    const h = lines.length * lineH(ctx.bodySize);
    if (!canFit(ctx, h + 6)) return null;
    drawText(ctx, skillsText, MARGIN, ctx.y, ctx.bodySize, INK);
    ctx.y += h + 6;
  }

  /* ---- Experience (STAR bullets swapped in) ------------------------- */
  if (resume.experience.length > 0) {
    if (!sectionHeader(ctx, "Experience")) return null;
    for (const [i, entry] of resume.experience.entries()) {
      const bullets = entry.details.map((b) => {
        const tip = tipFor(b);
        return tip ? composeStarBullet(tip) || b : b;
      });
      // Unplaced suggestions land under the first experience role.
      if (i === 0 && extraBullets.length > 0) bullets.push(...extraBullets);
      if (!drawEntry(ctx, entry, bullets)) return null;
      ctx.y += ENTRY_GAP;
    }
  }

  /* ---- Projects ------------------------------------------------------ */
  if (resume.projects.length > 0) {
    if (!sectionHeader(ctx, "Projects")) return null;
    for (const entry of resume.projects) {
      const bullets = entry.details.map((b) => {
        const tip = tipFor(b);
        return tip ? composeStarBullet(tip) || b : b;
      });
      if (!drawEntry(ctx, entry, bullets)) return null;
      ctx.y += ENTRY_GAP;
    }
  }

  /* ---- Education ------------------------------------------------------ */
  if (resume.education.length > 0) {
    if (!sectionHeader(ctx, "Education")) return null;
    for (const entry of resume.education) {
      if (!drawEntry(ctx, entry, entry.details, true)) return null;
      ctx.y += ENTRY_GAP;
    }
  }

  // Fits within one page.
  return canFit(ctx, 0) ? doc : null;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Generate and download the tailored resume. Tries smaller type until it fits one page. */
export function generateResumePdf(resume: ParsedResume, analysis: Analysis): void {
  const sizes = [10, 9.5, 9, 8.5, 8];
  for (const size of sizes) {
    const doc = buildDoc(resume, analysis, size, false);
    if (doc) {
      doc.save("SkillFit_Tailored_Resume.pdf");
      return;
    }
  }
  // Last resort: let the 8pt layout flow onto a second page.
  const doc = buildDoc(resume, analysis, 8, true);
  if (doc) doc.save("SkillFit_Tailored_Resume.pdf");
}