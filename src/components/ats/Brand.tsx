import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandProps {
  /** Show the tagline under the wordmark */
  tagline?: boolean;
  className?: string;
}

export function Brand({ tagline = true, className }: BrandProps) {
  return (
    <div className={cn("flex select-none items-center gap-2.5", className)}>
      <span className="relative grid size-9 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-sky-400 via-cyan-300 to-teal-300 shadow-[0_0_22px_-6px_rgba(56,189,248,0.6)]">
        <Zap className="size-[18px] text-slate-950" strokeWidth={2.75} fill="currentColor" />
      </span>
      <span className="leading-none">
        <span className="block text-[15px] font-bold tracking-tight text-white">
          SkillFit
        </span>
        {tagline && (
          <span className="mt-1 block text-[10.5px] font-medium tracking-wide text-white/50">
            Crack the ATS. Land the interview.
          </span>
        )}
      </span>
    </div>
  );
}
