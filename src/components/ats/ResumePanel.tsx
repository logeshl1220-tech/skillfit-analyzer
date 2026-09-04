import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import {
  FileText,
  FileUp,
  Loader2,
  PencilLine,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { extractTextFromPdf } from "@/lib/pdf";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  name: string;
  kind: "pdf" | "text";
  chars: number;
}

type ResumeMode = "upload" | "paste";

interface ResumePanelProps {
  mode: ResumeMode;
  onModeChange: (mode: ResumeMode) => void;
  resumeText: string;
  onResumeTextChange: (text: string) => void;
  file: UploadedFile | null;
  onFileChange: (file: UploadedFile | null, text: string) => void;
  disabled?: boolean;
}

const ACCEPTED_EXT = [".pdf", ".txt", ".md", ".json", ".csv"];

function looksLikePdf(name: string) {
  return name.toLowerCase().endsWith(".pdf");
}

export function ResumePanel({
  mode,
  onModeChange,
  resumeText,
  onResumeTextChange,
  file,
  onFileChange,
  disabled,
}: ResumePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  async function ingest(fileOrNull: File | null | undefined) {
    if (!fileOrNull || disabled) return;
    const f = fileOrNull;

    if (looksLikePdf(f.name)) {
      setBusy(true);
      try {
        const text = await extractTextFromPdf(f);
        if (text.replace(/\s/g, "").length < 40) {
          toast.error("Couldn't read text from this PDF", {
            description:
              "It may be a scanned image. Paste the text manually or try a different file.",
          });
          return;
        }
        onFileChange({ name: f.name, kind: "pdf", chars: text.length }, text);
        toast.success("Resume parsed from PDF", {
          description: `${f.name} · ${text.length.toLocaleString()} characters extracted`,
        });
      } catch {
        toast.error("Couldn't open this PDF", {
          description:
            "The file may be corrupted. Paste the resume text instead and we'll analyze it the same way.",
        });
      } finally {
        setBusy(false);
      }
      return;
    }

    const ext = f.name.includes(".")
      ? f.name.slice(f.name.lastIndexOf(".")).toLowerCase()
      : "";
    if (ext && !ACCEPTED_EXT.includes(ext) && !f.type.startsWith("text/")) {
      toast.error("Unsupported file type", {
        description: "Upload a .pdf or .txt resume — or just paste the text.",
      });
      return;
    }

    try {
      const text = await f.text();
      onFileChange({ name: f.name, kind: "text", chars: text.length }, text);
      toast.success("Resume loaded", {
        description: `${f.name} · ${text.length.toLocaleString()} characters`,
      });
    } catch {
      toast.error("Couldn't read that file");
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void ingest(event.dataTransfer.files?.[0]);
  }

  return (
    <section className="glass flex h-full flex-col rounded-2xl p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-sky-400/15 text-sky-300">
            <FileText className="size-[18px]" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">Your resume</h2>
            <p className="text-xs text-white/45">Step 1 · upload a PDF or paste text</p>
          </div>
        </div>
        {/* Mode switch */}
        <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
          {(["upload", "paste"] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={disabled || (m === "upload" && busy)}
              onClick={() => onModeChange(m)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                mode === m
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/45 hover:text-white/80",
              )}
            >
              {m === "upload" ? "Upload" : "Paste"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex-1">
        {mode === "upload" ? (
          file ? (
            /* Uploaded-file card */
            <div className="flex h-full min-h-56 flex-col justify-between gap-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300">
                  <FileText className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {file.name}
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-200/70">
                    {file.kind === "pdf" ? "PDF parsed successfully" : "Text file loaded"} ·{" "}
                    {file.chars.toLocaleString()} characters
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                  disabled={disabled}
                  onClick={() => onModeChange("paste")}
                >
                  <PencilLine className="size-3.5" />
                  Review extracted text
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-rose-300/90 hover:bg-rose-400/10 hover:text-rose-200"
                  disabled={disabled}
                  onClick={() => {
                    onFileChange(null, "");
                    onModeChange("upload");
                  }}
                >
                  <Trash2 className="size-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            /* Dropzone */
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload resume file"
              onClick={() => !busy && inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex h-full min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center transition-all",
                dragging
                  ? "border-sky-300/70 bg-sky-400/10"
                  : "border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]",
                busy && "pointer-events-none opacity-70",
              )}
            >
              <span
                className={cn(
                  "grid size-12 place-items-center rounded-2xl border transition-colors",
                  dragging
                    ? "border-sky-300/40 bg-sky-400/20 text-sky-200"
                    : "border-white/10 bg-white/[0.05] text-sky-300",
                )}
              >
                {busy ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <UploadCloud className="size-6" />
                )}
              </span>
              <div>
                <p className="text-sm font-medium text-white">
                  {busy ? "Reading your PDF…" : "Drag & drop your resume"}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {busy ? "One second — extracting text" : "or click to browse · PDF or TXT"}
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="flex h-full flex-col gap-2">
            <Textarea
              value={resumeText}
              onChange={(e) => onResumeTextChange(e.target.value)}
              placeholder={
                "Paste your resume text here…\n\nName, contact info, education, skills,\nprojects, internships — everything a recruiter would read."
              }
              disabled={disabled}
              className="h-full min-h-56 resize-none border-white/10 bg-white/[0.03] text-[13.5px] leading-relaxed text-white/90 placeholder:text-white/25 focus:border-sky-300/40 focus:ring-sky-300/20"
              aria-label="Resume text"
            />
            <p className="text-right text-[11px] tabular-nums text-white/35">
              {resumeText.length.toLocaleString()} characters
            </p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md,.json,.csv,text/plain,application/pdf"
        className="hidden"
        onChange={(e) => {
          void ingest(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-white/35">
        <FileUp className="mt-0.5 size-3 shrink-0" />
        Files are analyzed in your browser — nothing is uploaded to a server.
      </p>
    </section>
  );
}
