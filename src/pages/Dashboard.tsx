import { useRef, useState } from "react";
import {
  CheckCircle2,
  CircleDashed,
  FileCheck2,
  Loader2,
  MessageSquareText,
  Sparkles,
  TriangleAlert,
  Wand2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoDropdown } from "@/components/LogoDropdown";
import { Brand } from "@/components/ats/Brand";
import { ResumePanel, type UploadedFile } from "@/components/ats/ResumePanel";
import { JobPanel } from "@/components/ats/JobPanel";
import { AnalysisResults } from "@/components/ats/AnalysisResults";
import {
  ROLE_PRESETS,
  sampleScenario,
} from "@/lib/ats";
import { analyze, type Analysis } from "@/lib/ats/engine";
import { cn } from "@/lib/utils";

type ResumeMode = "upload" | "paste";
type Phase = "idle" | "running" | "done";

const STAGES = [
  "Reading resume & job description",
  "Scanning 100+ tracked skills & keywords",
  "Scoring keyword coverage & structure",
  "Writing STAR bullet rewrites",
  "Drafting 5 tailored interview questions",
];

const TONE_TEXT: Record<Analysis["tone"], string> = {
  high: "text-emerald-300",
  mid: "text-amber-300",
  low: "text-rose-300",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Dashboard() {
  const [resumeMode, setResumeMode] = useState<ResumeMode>("paste");
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<UploadedFile | null>(null);
  const [jd, setJd] = useState("");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stageIndex, setStageIndex] = useState(0);
  const [analysis, setAnalysis] = useState<(Analysis & { aiPowered: boolean }) | null>(null);
  const [runId, setRunId] = useState(0);

  const topRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  async function runAnalysis(resume: string, description: string, roleHint?: string) {
    if (resume.trim().length < 60) {
      setResumeMode("paste");
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return false;
    }
    if (description.trim().length < 60) {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return false;
    }

    setPhase("running");
    setAnalysis(null);
    setStageIndex(0);

    // Staged progress so the scan feels like a real pipeline.
    for (let i = 0; i < STAGES.length; i++) {
      setStageIndex(i);
      await sleep(380);
    }

    const next = await analyze({ resume, jd: description, roleHint });
    setAnalysis(next);
    setRunId((id) => id + 1);
    setPhase("done");
    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    return true;
  }

  function handleAnalyze() {
    void runAnalysis(resumeText, jd, undefined);
  }

  function handleLoadSample() {
    const sample = sampleScenario();
    setResumeFile(null);
    setResumeText(sample.resume);
    setJd(sample.jd);
    setActivePresetId(sample.presetId);
    setResumeMode("paste");
    void runAnalysis(sample.resume, sample.jd, sample.roleHint);
  }

  function handleNewScan() {
    setAnalysis(null);
    setPhase("idle");
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleFileChange(file: UploadedFile | null, text: string) {
    setResumeFile(file);
    setResumeText(text);
  }

  const busy = phase === "running";
  const canAnalyze = resumeText.trim().length >= 60 && jd.trim().length >= 60;

  return (
    <div className="relative min-h-screen text-white">
      {/* Ambient backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_-12%,rgba(56,189,248,0.13),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(40%_35%_at_88%_105%,rgba(45,212,191,0.09),transparent_70%)]" />
      </div>

      {/* ------------------------------------------------ Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="rounded-lg transition-opacity hover:opacity-85"
          >
            <Brand tagline={false} />
          </button>

          {/* Quick stats */}
          {analysis && phase === "done" && (
            <div className="hidden items-center gap-1.5 md:flex">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs">
                <Zap className="size-3.5 text-sky-300" />
                <span className="text-white/50">ATS</span>
                <span className={cn("tnum font-bold", TONE_TEXT[analysis.tone])}>
                  {analysis.score}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs">
                <TriangleAlert className="size-3.5 text-amber-300" />
                <span className="text-white/50">Missing</span>
                <span className="tnum font-bold text-white/90">
                  {analysis.missingSkills.length}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs">
                <MessageSquareText className="size-3.5 text-cyan-300" />
                <span className="text-white/50">Mock Qs</span>
                <span className="tnum font-bold text-white/90">
                  {analysis.questions.length}
                </span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleNewScan}
              disabled={busy || phase === "idle"}
              className="text-white/60 hover:bg-white/[0.06] hover:text-white"
            >
              <FileCheck2 className="size-4" />
              <span className="hidden sm:inline">New scan</span>
            </Button>
            <LogoDropdown />
          </div>
        </div>
      </header>

      {/* ------------------------------------------------ Main */}
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
        {/* Intro */}
        <div ref={topRef} className="scroll-mt-24">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
                <Sparkles className="size-3" />
                ATS Fit Analyzer
              </p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-[28px]">
                How well does your resume match this job?
              </h1>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/50">
                Paste your resume + a job description, and get an ATS-style fit
                score, your skill gaps, rewrite-ready STAR bullets, and a mock
                interview kit — in about two seconds.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleLoadSample}
              disabled={busy}
              className="shrink-0 self-start border-cyan-300/25 bg-cyan-400/[0.06] text-cyan-200 hover:bg-cyan-400/[0.14] hover:text-cyan-100 sm:self-auto"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
              Load sample data
            </Button>
          </div>
        </div>

        {/* Inputs */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ResumePanel
            mode={resumeMode}
            onModeChange={setResumeMode}
            resumeText={resumeText}
            onResumeTextChange={setResumeText}
            file={resumeFile}
            onFileChange={handleFileChange}
            disabled={busy}
          />
          <JobPanel
            jd={jd}
            onJdChange={(text) => {
              setJd(text);
              // A chip describes its JD; deselect once the text drifts away.
              if (activePresetId) {
                const preset = ROLE_PRESETS.find(
                  (p) => p.id === activePresetId,
                );
                if (preset && preset.jd !== text) setActivePresetId(null);
              }
            }}
            activePresetId={activePresetId}
            onPresetSelect={(presetId) => {
              const preset = ROLE_PRESETS.find((p) => p.id === presetId);
              if (!preset) return;
              setJd(preset.jd);
              setActivePresetId(presetId);
            }}
            disabled={busy}
          />
        </div>

        {/* Action bar */}
        <div className="glass mt-4 flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p className="text-xs leading-relaxed text-white/40">
            <span className="font-medium text-white/70">Powered by Google Gemini.</span>{" "}
            Resume and JD are sent to Gemini for deep analysis. Falls back to
            a local rule engine if the API key is unavailable.
          </p>
          <Button
            type="button"
            size="lg"
            onClick={handleAnalyze}
            disabled={busy || !canAnalyze}
            className="h-12 shrink-0 gap-2 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-7 text-[15px] font-semibold text-slate-950 shadow-[0_10px_32px_-10px_rgba(56,189,248,0.55)] transition-all hover:brightness-110 disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Zap className="size-5" fill="currentColor" />
                Analyze Compatibility
              </>
            )}
          </Button>
        </div>

        {/* ------------------------------------------------ Results zone */}
        {phase === "running" && (
          <div ref={resultsRef} className="mt-10 scroll-mt-24">
            <div className="glass sf-rise mx-auto max-w-xl rounded-2xl p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-sky-400/20 to-cyan-300/20 text-cyan-300">
                  <Loader2 className="size-5 animate-spin" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Running your compatibility scan
                  </h2>
                  <p className="text-xs text-white/40">
                    Gemini AI · server-side · ~3-5 seconds
                  </p>
                </div>
              </div>
              <ul className="mt-6 flex flex-col gap-3.5">
                {STAGES.map((stage, i) => {
                  const state =
                    i < stageIndex ? "done" : i === stageIndex ? "active" : "todo";
                  return (
                    <li key={stage} className="flex items-center gap-3">
                      {state === "done" ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                      ) : state === "active" ? (
                        <Loader2 className="size-4 shrink-0 animate-spin text-sky-300" />
                      ) : (
                        <CircleDashed className="size-4 shrink-0 text-white/20" />
                      )}
                      <span
                        className={cn(
                          "text-[13px] transition-colors",
                          state === "done"
                            ? "text-white/45"
                            : state === "active"
                              ? "font-medium text-white/90"
                              : "text-white/25",
                        )}
                      >
                        {stage}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {phase === "done" && analysis && (
          <div ref={resultsRef} className="mt-10 scroll-mt-24">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Your compatibility report
                  {analysis.aiPowered && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-sky-400/25 bg-sky-400/[0.10] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-300">
                      <Sparkles className="size-2.5" />
                      AI Powered
                    </span>
                  )}
                </h2>
                <p className="mt-1 text-xs text-white/45">
                  Score, gaps, STAR rewrites and interview questions — all
                  generated from your inputs.
                </p>
              </div>
              {/* mobile stats */}
              <div className="flex items-center gap-1.5 md:hidden">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px]">
                  <Zap className="size-3 text-sky-300" />
                  <span className="tnum font-bold text-white/90">
                    {analysis.score}
                  </span>
                  <span className="text-white/45">ATS</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px]">
                  <TriangleAlert className="size-3 text-amber-300" />
                  <span className="tnum font-bold text-white/90">
                    {analysis.missingSkills.length}
                  </span>
                  <span className="text-white/45">missing</span>
                </span>
              </div>
            </div>
            <AnalysisResults
              key={runId}
              analysis={analysis}
              onNewScan={handleNewScan}
            />
          </div>
        )}

        {phase === "idle" && (
          <div className="mt-12 flex justify-center">
            <p className="max-w-md text-center text-xs leading-relaxed text-white/30">
              Tip: hit <span className="text-white/60">Load sample data</span> to
              see a full report instantly, or pick a role preset above to have the
              job description filled in for you.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
