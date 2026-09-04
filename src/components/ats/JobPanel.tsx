import {
  BarChart3,
  Braces,
  Database,
  FlaskConical,
  Layers,
  Rocket,
  Sparkles,
  Target,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ROLE_PRESETS } from "@/lib/ats";
import { cn } from "@/lib/utils";

const PRESET_ICONS: Record<string, typeof Layers> = {
  fullstack: Layers,
  frontend: Braces,
  data: BarChart3,
  "react-intern": Rocket,
  backend: Database,
  ai: FlaskConical,
};

export type { RolePreset } from "@/lib/ats";

interface JobPanelProps {
  jd: string;
  onJdChange: (jd: string) => void;
  activePresetId: string | null;
  onPresetSelect: (presetId: string) => void;
  disabled?: boolean;
}

export function JobPanel({
  jd,
  onJdChange,
  activePresetId,
  onPresetSelect,
  disabled,
}: JobPanelProps) {
  return (
    <section className="glass flex h-full flex-col rounded-2xl p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-cyan-400/15 text-cyan-300">
            <Target className="size-[18px]" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">Job description</h2>
            <p className="text-xs text-white/45">Step 2 · paste the JD or pick a preset</p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/55 sm:flex">
          <Sparkles className="size-3 text-cyan-300" />
          AI presets
        </span>
      </div>

      {/* Role presets */}
      <div className="mt-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
          Role presets
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ROLE_PRESETS.map((preset) => {
            const Icon = PRESET_ICONS[preset.id] ?? Layers;
            const active = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={disabled}
                onClick={() => onPresetSelect(preset.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-all",
                  active
                    ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-200 shadow-[0_0_14px_-4px_rgba(103,232,249,0.5)]"
                    : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:bg-white/[0.06] hover:text-white/85",
                )}
              >
                <Icon className="size-3.5" />
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* JD textarea */}
      <div className="mt-4 flex flex-1 flex-col gap-2">
        <Textarea
          value={jd}
          onChange={(e) => onJdChange(e.target.value)}
          placeholder={
            "Paste the full job description…\n\nTitle, responsibilities, required skills, nice-to-haves —\nthe more detail, the sharper the gap analysis."
          }
          disabled={disabled}
          className="h-full min-h-56 resize-none border-white/10 bg-white/[0.03] text-[13.5px] leading-relaxed text-white/90 placeholder:text-white/25 focus:border-cyan-300/40 focus:ring-cyan-300/20"
          aria-label="Job description text"
        />
        <p className="text-right text-[11px] tabular-nums text-white/35">
          {jd.length.toLocaleString()} characters
        </p>
      </div>
    </section>
  );
}
