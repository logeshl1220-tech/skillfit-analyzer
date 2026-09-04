import { motion } from "framer-motion";
import { Link } from "react-router";
import {
  ArrowRight,
  BarChart3,
  Braces,
  CheckCircle2,
  ChevronDown,
  ClipboardType,
  Database,
  FileCheck2,
  FlaskConical,
  Gauge,
  Layers,
  ListChecks,
  MessageSquareText,
  Rocket,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Wand2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/ats/Brand";
import { ScoreRing } from "@/components/ats/ScoreRing";
import { ROLE_PRESETS } from "@/lib/ats";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: EASE },
};

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const FEATURES: Array<{
  icon: typeof Gauge;
  tile: string;
  title: string;
  body: string;
}> = [
  {
    icon: Gauge,
    tile: "text-sky-300 bg-sky-400/12 border-sky-400/20",
    title: "ATS fit score in seconds",
    body: "A 0–100 score built from four explainable signals — keyword match, resume structure, impact language, and formatting hygiene.",
  },
  {
    icon: ListChecks,
    tile: "text-emerald-300 bg-emerald-400/12 border-emerald-400/20",
    title: "Skill gap breakdown",
    body: "Green chips for what your resume covers, amber chips for what the job expects. No more guessing which keywords you're missing.",
  },
  {
    icon: Wand2,
    tile: "text-cyan-300 bg-cyan-400/12 border-cyan-400/20",
    title: "STAR bullet optimizer",
    body: "Three weak resume lines rewritten in Situation–Task–Action–Result format, with quantified results — ready to adapt to your story.",
  },
  {
    icon: MessageSquareText,
    tile: "text-violet-300 bg-violet-400/12 border-violet-400/20",
    title: "Interview prep kit",
    body: "Five technical and behavioral questions generated from your exact gaps, each with the reasoning an interviewer is testing.",
  },
  {
    icon: FileCheck2,
    tile: "text-teal-300 bg-teal-400/12 border-teal-400/20",
    title: "PDF or plain text",
    body: "Drag in your resume PDF and it's parsed locally in your browser — or paste the text. Your file never leaves your device.",
  },
  {
    icon: Rocket,
    tile: "text-amber-300 bg-amber-400/12 border-amber-400/20",
    title: "Presets & sample data",
    body: "Load a full sample scenario in one click, or fill the job description with role presets for React, data, backend and more.",
  },
];

const STEPS: Array<{
  icon: typeof UploadCloud;
  step: string;
  title: string;
  body: string;
}> = [
  {
    icon: UploadCloud,
    step: "01",
    title: "Add your resume",
    body: "Drop in a PDF or paste plain text. Extraction runs in the browser — nothing is uploaded to a server.",
  },
  {
    icon: ClipboardType,
    step: "02",
    title: "Paste the job description",
    body: "Any JD works. Short on one? Tap a role preset like “Fullstack Dev” or “Data Analyst” and it fills itself.",
  },
  {
    icon: Sparkles,
    step: "03",
    title: "Get your playbook",
    body: "A fit score, matched vs. missing keywords, three STAR bullet rewrites, and five practice questions — in about two seconds.",
  },
];

const STATS = [
  { value: "75%", label: "of resumes are rejected by an ATS before a human reads them" },
  { value: "~2s", label: "average scan time, running fully in your browser" },
  { value: "100+", label: "skills & keywords tracked across six role presets" },
  { value: "0", label: "API keys, signup fees, or setup required to start" },
];

const PRESET_ICONS: Record<string, typeof Layers> = {
  fullstack: Layers,
  frontend: Braces,
  data: BarChart3,
  "react-intern": Rocket,
  backend: Database,
  ai: FlaskConical,
};

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_-10%,rgba(56,189,248,0.14),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(38%_32%_at_92%_25%,rgba(45,212,191,0.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(40%_35%_at_8%_75%,rgba(59,130,246,0.07),transparent_70%)]" />
        <div className="bg-grid absolute inset-x-0 top-0 h-[560px] [mask-image:radial-gradient(70%_70%_at_50%_0%,black,transparent)]" />
      </div>

      {/* -------------------------------------------------- Nav */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-1 md:flex">
            {[
              { label: "How it works", id: "how" },
              { label: "Features", id: "features" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToId(item.id)}
                className="rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden text-white/60 hover:bg-white/[0.06] hover:text-white sm:inline-flex"
            >
              <Link to="/dashboard">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-950 hover:brightness-110">
              <Link to="/dashboard">
                Open Analyzer
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* -------------------------------------------------- Hero */}
        <section className="relative">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:pb-24 lg:pt-24">
            {/* Copy */}
            <div className="max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur"
              >
                <Sparkles className="size-3.5 text-sky-300" />
                AI resume & ATS analyzer — built for students & freshers
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 text-[42px] font-bold leading-[1.04] tracking-tight sm:text-6xl"
              >
                Crack the ATS.
                <br />
                <span className="text-gradient">Land the interview.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5 max-w-lg text-base leading-relaxed text-white/55"
              >
                SkillFit compares your resume against any job description the way
                an applicant tracking system does — then hands you the exact
                keywords, STAR rewrites, and mock questions to close every gap
                before a recruiter ever reads it.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <Button
                  asChild
                  size="lg"
                  className="h-12 gap-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-7 text-[15px] font-semibold text-slate-950 shadow-[0_12px_36px_-12px_rgba(56,189,248,0.7)] transition-all hover:brightness-110"
                >
                  <Link to="/dashboard">
                    Analyze my resume
                    <Zap className="size-5" fill="currentColor" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => scrollToId("how")}
                  className="gap-1.5 text-white/70 hover:bg-white/[0.06] hover:text-white"
                >
                  See how it works
                  <ChevronDown className="size-4" />
                </Button>
              </motion.div>

              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.34 }}
                className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/45"
              >
                {["No credit card", "Sample data built in", "PDF parsed locally", "Free forever tier"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-400/90" />
                      {item}
                    </li>
                  ),
                )}
              </motion.ul>
            </div>

            {/* Mock report */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-md lg:max-w-none"
            >
              <div className="glass-strong relative rounded-3xl p-6 shadow-[0_40px_90px_-40px_rgba(2,6,23,0.9)] sm:p-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-lg bg-white/[0.06] text-sky-300">
                      <FileCheck2 className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">Compatibility report</p>
                      <p className="text-[11px] text-white/40">vs. Full-Stack Developer</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                    High Match
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-6">
                  <div className="relative shrink-0">
                    <ScoreRing value={78} tone="high" size={150} strokeWidth={12} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                        <CheckCircle2 className="size-3.5" /> Matched — 12
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {["React", "TypeScript", "Node.js", "REST APIs", "Git"].map((s) => (
                          <span key={s} className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2 py-0.5 text-[10px] font-medium text-emerald-300/90">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                        <Sparkles className="size-3.5" /> Missing — 6
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {["Docker", "GraphQL", "Redis", "Jest"].map((s) => (
                          <span key={s} className="rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-2 py-0.5 text-[10px] font-medium text-amber-300/90">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2.5 border-t border-white/[0.07] pt-5">
                  {[
                    { icon: Wand2, tint: "text-cyan-300", text: "STAR rewrite for “Worked on the admin dashboard”" },
                    { icon: MessageSquareText, tint: "text-violet-300", text: "5 interview questions from your skill gaps" },
                  ].map((row) => (
                    <div key={row.text} className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                      <row.icon className={`size-4 shrink-0 ${row.tint}`} />
                      <span className="truncate text-xs text-white/65">{row.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating chip */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="glass absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-2xl px-4 py-3 shadow-xl sm:flex lg:-left-8"
              >
                <ShieldCheck className="size-5 text-emerald-300" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">100% local</p>
                  <p className="text-[10.5px] text-white/45">No resume uploads</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* -------------------------------------------------- Role presets strip */}
        <section className="border-y border-white/[0.05] bg-white/[0.015]">
          <div className="mx-auto w-full max-w-6xl px-4 py-9 sm:px-6">
            <div className="flex flex-col items-center gap-5">
              <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-white/35">
                Built-in role presets for the jobs freshers actually apply to
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {ROLE_PRESETS.map((preset) => {
                  const Icon = PRESET_ICONS[preset.id] ?? Layers;
                  return (
                    <Link
                      key={preset.id}
                      to="/dashboard"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/65 transition-all hover:border-sky-300/30 hover:bg-sky-400/10 hover:text-white"
                    >
                      <Icon className="size-3.5 text-sky-300/80" />
                      {preset.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- How it works */}
        <section id="how" className="scroll-mt-20">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
            <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300/80">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Three steps between you and a <span className="text-gradient">better resume</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/50">
                No template library, no generic advice. The analysis is computed
                against <em>your</em> resume and <em>the specific job</em> you're
                chasing.
              </p>
            </motion.div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.step}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                  className="glass group relative overflow-hidden rounded-2xl p-6 transition-colors hover:border-white/20"
                >
                  <span className="tnum absolute right-5 top-5 text-4xl font-bold text-white/[0.06] transition-colors group-hover:text-white/[0.1]">
                    {step.step}
                  </span>
                  <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-sky-400/15 to-cyan-300/15 text-sky-300">
                    <step.icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-[15px] font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/50">{step.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- Features */}
        <section id="features" className="scroll-mt-20 bg-white/[0.015]">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
            <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300/80">
                Features
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything a job search needs, <span className="text-gradient">nothing it doesn't</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/50">
                The full report pipeline — score, gaps, rewrites, interview kit —
                is one click away from your inputs.
              </p>
            </motion.div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: (i % 3) * 0.08 }}
                  className="glass rounded-2xl p-6 transition-colors hover:border-white/20"
                >
                  <span className={`grid size-10 place-items-center rounded-xl border ${feature.tile}`}>
                    <feature.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/50">{feature.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- Stats */}
        <section>
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="glass rounded-3xl px-6 py-10 sm:px-10">
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {STATS.map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <p className="text-gradient text-4xl font-bold tracking-tight sm:text-[40px]">
                      {stat.value}
                    </p>
                    <p className="mx-auto mt-2 max-w-[220px] text-xs leading-relaxed text-white/45 lg:mx-0">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- Final CTA */}
        <section className="pb-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="glass-strong relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12 sm:py-16">
              <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[520px] -translate-x-1/2 rounded-full bg-sky-400/15 blur-3xl" />
              <motion.div {...fadeUp} className="relative mx-auto max-w-2xl">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/70">
                  <Sparkles className="size-3.5 text-sky-300" />
                  Free for students · runs in your browser
                </p>
                <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[1.1]">
                  Your resume deserves a
                  <br className="hidden sm:block" /> second pair of eyes.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/55">
                  See exactly what an ATS sees — then walk into the interview with
                  the questions already practiced. Takes about two minutes.
                </p>
                <div className="mt-8 flex justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="h-13 gap-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-8 text-[15px] font-semibold text-slate-950 shadow-[0_12px_40px_-12px_rgba(56,189,248,0.8)] hover:brightness-110"
                  >
                    <Link to="/dashboard">
                      Open the analyzer — it's free
                      <ArrowRight className="size-5" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* -------------------------------------------------- Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Brand />
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} SkillFit · Crack the ATS. Land the interview.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <Link to="/dashboard" className="transition-colors hover:text-white">
              Analyzer
            </Link>
            <Link to="/auth" className="transition-colors hover:text-white">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
