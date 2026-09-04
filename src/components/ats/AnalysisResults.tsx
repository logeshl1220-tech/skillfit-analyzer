import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  Gauge,
  Lightbulb,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Wand2,
} from "lucide-react";
import type { Analysis, BulletTip, InterviewQuestion, RatingTone } from "@/lib/ats";
import { ScoreRing } from "@/components/ats/ScoreRing";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function SectionCard({
  icon: Icon,
  title,
  description,
  right,
  children,
  className,
  delay = 0,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn("glass sf-rise rounded-2xl p-5 sm:p-6", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-white/85">
            <Icon className="size-[18px]" />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-white">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 max-w-md text-xs leading-relaxed text-white/45">
                {description}
              </p>
            )}
          </div>
        </div>
        {right}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

const RATING_STYLES: Record<RatingTone, string> = {
  high: "border-emerald-400/30 bg-emerald-400/15 text-emerald-300",
  mid: "border-amber-400/30 bg-amber-400/15 text-amber-300",
  low: "border-rose-400/30 bg-rose-400/15 text-rose-300",
};

function signalColor(value: number) {
  if (value >= 75) return "bg-emerald-400";
  if (value >= 50) return "bg-amber-400";
  return "bg-rose-400";
}

function SkillChip({
  matched,
  label,
}: {
  matched: boolean;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        matched
          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
          : "border-amber-400/25 bg-amber-400/10 text-amber-300",
      )}
    >
      {matched ? (
        <CheckCircle2 className="size-3" />
      ) : (
        <TriangleAlert className="size-3" />
      )}
      {label}
    </span>
  );
}

function TypeBadge({ type }: { type: InterviewQuestion["type"] }) {
  const styles: Record<InterviewQuestion["type"], string> = {
    Technical:
      "border-sky-400/25 bg-sky-400/10 text-sky-300",
    Behavioral:
      "border-violet-400/25 bg-violet-400/10 text-violet-300",
    "Role Fit": "border-teal-400/25 bg-teal-400/10 text-teal-300",
  };
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide",
        styles[type],
      )}
    >
      {type}
    </span>
  );
}

const STAR_STYLES: Record<string, string> = {
  S: "bg-sky-400/15 text-sky-300 border-sky-400/25",
  T: "bg-cyan-400/15 text-cyan-300 border-cyan-400/25",
  A: "bg-teal-400/15 text-teal-300 border-teal-400/25",
  R: "bg-emerald-400/15 text-emerald-300 border-emerald-400/25",
};

function StarTip({ tip, index }: { tip: BulletTip; index: number }) {
  const lines: Array<{ key: string; label: string; text: string }> = [
    { key: "S", label: "Situation", text: tip.situation },
    { key: "T", label: "Task", text: tip.task },
    { key: "A", label: "Action", text: tip.action },
    { key: "R", label: "Result", text: tip.result },
  ];
  return (
    <div
      className="glass sf-rise flex flex-col rounded-2xl p-5"
      style={{ animationDelay: `${120 + index * 90}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-200">
          <Wand2 className="size-3" />
          {tip.skill}
        </span>
        <span className="tnum text-[11px] font-semibold text-white/30">
          0{index + 1}
        </span>
      </div>

      {tip.original ? (
        <blockquote className="mt-4 rounded-lg border-l-2 border-white/20 bg-black/25 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
            Your current line
          </p>
          <p className="mt-1 text-xs italic leading-relaxed text-white/50">
            “{tip.original}”
          </p>
        </blockquote>
      ) : (
        <p className="mt-4 text-xs leading-relaxed text-white/50">
          No weak “worked on / responsible for” line found — add this STAR bullet
          for <span className="font-medium text-cyan-200">{tip.skill}</span> to a
          relevant role or project.
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {lines.map((line) => (
          <li key={line.key} className="flex gap-2.5">
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-md border text-[10px] font-bold",
                STAR_STYLES[line.key],
              )}
            >
              {line.key}
            </span>
            <p className="text-xs leading-relaxed text-white/65">{line.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main results view                                                   */
/* ------------------------------------------------------------------ */

interface AnalysisResultsProps {
  analysis: Analysis;
  onNewScan: () => void;
}

export function AnalysisResults({ analysis, onNewScan }: AnalysisResultsProps) {
  const { score, tone, rating, signals, matchedSkills, missingSkills, roleLabel } =
    analysis;

  return (
    <div className="flex flex-col gap-4">
      {/* Top row: score + breakdown */}
      <div className="grid gap-4 lg:grid-cols-[minmax(300px,360px)_1fr]">
        <div
          className="glass sf-rise relative flex flex-col items-center overflow-hidden rounded-2xl px-6 py-8 text-center"
          style={{ animationDelay: "0ms" }}
        >
          {/* soft glow behind the ring */}
          <div
            className={cn(
              "pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl",
              tone === "high" && "bg-emerald-400/15",
              tone === "mid" && "bg-amber-400/15",
              tone === "low" && "bg-rose-400/15",
            )}
          />
          <div className="relative">
            <ScoreRing value={score} tone={tone} size={186} />
          </div>
          <span
            className={cn(
              "mt-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
              RATING_STYLES[tone],
            )}
          >
            <Gauge className="size-3.5" />
            {rating} · {score}/100
          </span>
          <p className="mt-3 text-xs leading-relaxed text-white/45">
            Fit against{" "}
            <span className="font-medium text-white/75">{roleLabel}</span>
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-emerald-300/90">
              {matchedSkills.length} matched
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-amber-300/90">
              {missingSkills.length} missing
            </span>
          </div>
        </div>

        {/* Breakdown */}
        <SectionCard
          icon={Gauge}
          title="Score breakdown"
          description="Four signals an ATS-style parser checks — see exactly where points were lost."
          delay={80}
        >
          <ul className="flex flex-col gap-4">
            {signals.map((signal) => (
              <li key={signal.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium text-white/85">
                    {signal.label}
                  </span>
                  <span className="tnum text-sm font-semibold text-white/90">
                    {signal.value}
                    <span className="text-xs font-normal text-white/35">/100</span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", signalColor(signal.value))}
                    style={{ width: `${signal.value}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-white/40">{signal.caption}</p>
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[11px] leading-relaxed text-white/45">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-cyan-300" />
            This scan runs on a built-in rule engine (100+ tracked skills) — no
            API key needed. Scores are directional guidance, not a recruiter.
          </p>
        </SectionCard>
      </div>

      {/* Skill gap */}
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard
          icon={CheckCircle2}
          title="Matched skills"
          description="Keywords your resume already covers — the ATS will flag these as present."
          delay={140}
          right={
            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
              {matchedSkills.length} found
            </span>
          }
        >
          {matchedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {matchedSkills.map((skill) => (
                <SkillChip key={skill} matched label={skill} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40">
              No JD keywords detected yet — paste a fuller job description to
              power this list.
            </p>
          )}
        </SectionCard>

        <SectionCard
          icon={TriangleAlert}
          title="Missing or understated"
          description="Required keywords the ATS won't find. These are your highest-leverage edits."
          delay={200}
          right={
            <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
              {missingSkills.length} gaps
            </span>
          }
        >
          {missingSkills.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {missingSkills.map((skill) => (
                  <SkillChip key={skill} matched={false} label={skill} />
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-white/45">
                <span className="font-semibold text-amber-300/90">Fix it:</span>{" "}
                add the top 2–3 skills to your Skills section <em>and</em> prove
                them in project/internship bullets. A bare list reads as keyword
                stuffing to human reviewers.
              </p>
            </>
          ) : (
            <p className="text-sm text-white/40">
              Every JD keyword is covered — nice work. Double-check you're also
              hitting them in context, not just the skills list.
            </p>
          )}
        </SectionCard>
      </div>

      {/* Bullet optimizer */}
      <SectionCard
        icon={Wand2}
        title="Bullet point optimizer"
        description="Three ready-to-adapt STAR rewrites based on your weakest lines and biggest gaps."
        delay={260}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {analysis.bulletTips.map((tip, i) => (
            <StarTip key={`${tip.skill}-${i}`} tip={tip} index={i} />
          ))}
        </div>
      </SectionCard>

      {/* Interview kit */}
      <SectionCard
        icon={MessageSquareText}
        title="AI interview prep kit"
        description={`Five questions a ${roleLabel.toLowerCase()} interviewer is likely to ask — drafted from your exact skill gaps.`}
        delay={320}
        right={
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-white/60">
            {analysis.questions.length} questions
          </span>
        }
      >
        <ul className="flex flex-col divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-black/15">
          {analysis.questions.map((q, i) => (
            <li key={i} className="flex flex-col gap-1.5 px-4 py-4 sm:px-5">
              <div className="flex items-center gap-2.5">
                <TypeBadge type={q.type} />
                <span className="tnum text-[11px] font-semibold text-white/30">
                  Q{i + 1}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium leading-relaxed text-white/90">
                {q.question}
              </p>
              <p className="flex items-start gap-1.5 text-xs leading-relaxed text-white/40">
                <Lightbulb className="mt-0.5 size-3 shrink-0 text-amber-300/80" />
                {q.why}
              </p>
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* Re-run */}
      <div className="sf-rise flex justify-center pt-1" style={{ animationDelay: "380ms" }}>
        <button
          type="button"
          onClick={onNewScan}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <RefreshCw className="size-3.5" />
          Tweak inputs & scan again
        </button>
      </div>
    </div>
  );
}
