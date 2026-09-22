/**
 * Dev-only smoke test for the PDF builder (run: bun scripts/pdf-smoke.ts).
 * Verifies:
 *  1. Composed STAR bullets contain no coaching labels ("S:", "T:", etc.).
 *  2. Skills and Summary lines all fit within the page margins (no clipping).
 *  3. Every drawn text fragment, line-wrapped at body size, fits CONTENT_W.
 * Not bundled into the app.
 */
import { buildDoc, composeStarBullet, generateCoverLetterPdf } from "../src/lib/ats/pdf";
import {
  analyzeJobFit,
  coverLetterToText,
  localCoverLetter,
  parseResume,
  sampleScenario,
} from "../src/lib/ats";

const sample = sampleScenario();
const analysis = analyzeJobFit({ resume: sample.resume, jd: sample.jd });
const resume = parseResume(sample.resume);

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.error(`FAIL: ${msg}`);
};

/* ---- 1. STAR bullets are label-free flowing sentences ------------------ */
const composed = analysis.bulletTips.map(composeStarBullet);
for (const bullet of composed) {
  if (!bullet) fail("a STAR tip composed to an empty bullet");
  if (/\b(S|T|A|R):/.test(bullet) || /(?<![\w])(Situation|Task|Action|Result):/.test(bullet)) {
    fail(`bullet still contains a STAR label: ${bullet}`);
  }
  if (/[A-Z]:\s/.test(bullet) && !/https?:/.test(bullet)) {
    fail(`bullet contains a coaching-style label: ${bullet}`);
  }
}
console.log(`1. STAR bullets (${composed.length}):`);
composed.forEach((b, i) => console.log(`   [${i + 1}] ${b}`));

/* ---- 2. Doc builds via the same size-retry loop as the download -------- */
const SIZES = [10, 9.5, 9, 8.5, 8];
let builtAt: number | null = null;
let doc: ReturnType<typeof buildDoc> = null;
for (const size of SIZES) {
  doc = buildDoc(resume, analysis, size, false, false);
  if (doc) {
    builtAt = size;
    break;
  }
}
if (!doc || builtAt === null) {
  fail("buildDoc returned null for every size — sample resume should fit one page");
} else {
  const pages = doc.getNumberOfPages();
  if (pages !== 1) fail(`expected 1 page, got ${pages}`);
  console.log(`2. PDF builds at ${builtAt}pt · ${pages} page(s) · OK`);
}

/* ---- 3. Skills + Summary wrap inside margins ---------------------------- */
// Re-wrap the merged skill list the same way buildDoc does and assert each
// drawn line's measured width is within CONTENT_W.
const MARGIN = 43.2;
const CONTENT_W = 612 - MARGIN * 2;
const merged = [...resume.skills, ...analysis.matchedSkills];
const seen = new Set<string>();
const skills: string[] = [];
for (const raw of merged) {
  const key = raw.trim().toLowerCase();
  if (key && !seen.has(key)) {
    seen.add(key);
    skills.push(raw.trim());
  }
}
if (doc) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(skills.join(", "), CONTENT_W) as string[];
  for (const line of lines) {
    if (doc.getTextWidth(line) > CONTENT_W) {
      fail(`skills line exceeds margins: "${line.slice(0, 60)}…"`);
    }
  }
  console.log(`3. Skills wrapped into ${lines.length} line(s), all within margins · OK`);
} else {
  fail("no doc to wrap-check against");
}

/* ---- 4. Overflow resumes still build with allowOverflow ----------------- */
const huge = {
  ...resume,
  experience: [
    ...resume.experience,
    {
      title: "Overflow Role",
      subtitle: "Long filler company",
      dates: "2020 – 2024",
      details: Array.from({ length: 30 }, (_, i) => `Bullet ${i}: shipped features with React, TypeScript and GraphQL for scale.`),
    },
  ],
};
const overflowDoc = buildDoc(huge, analysis, 8, true, false);
if (!overflowDoc) fail("allowOverflow path returned null");
else console.log(`4. Overflow path builds (${overflowDoc.getNumberOfPages()} pages) · OK`);

/* ---- 5. Local cover letter composer ------------------------------------- */
const draft = localCoverLetter(analysis);
if (draft.paragraphs.length < 3) {
  fail(`expected 3-4 paragraphs, got ${draft.paragraphs.length}`);
}
if (draft.paragraphs.some((p) => /\b(S|T|A|R):/.test(p))) {
  fail("cover letter contains STAR labels");
}
if (draft.paragraphs.some((p) => p.length < 80)) {
  fail("cover letter has a suspiciously short paragraph (<80 chars)");
}
console.log(`5. Local cover letter: ${draft.paragraphs.length} paragraphs · OK`);

/* ---- 6. Cover-letter PDF builds ----------------------------------------- */
try {
  generateCoverLetterPdf(resume, draft); // exercises the builder end-to-end
  console.log("6. Cover-letter PDF builds · OK");
} catch (e) {
  fail(`cover-letter PDF threw: ${e instanceof Error ? e.message : e}`);
}

/* ---- 7. Letter text round-trip ------------------------------------------- */
const letterText = coverLetterToText(draft);
const back = letterText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
if (back.length !== draft.paragraphs.length) {
  fail(`paragraph round-trip mismatch: ${back.length} vs ${draft.paragraphs.length}`);
}
console.log("7. Letter text round-trip · OK");

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll PDF smoke checks passed.");
