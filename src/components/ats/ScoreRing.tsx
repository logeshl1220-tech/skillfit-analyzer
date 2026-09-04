import { useEffect, useId, useState } from "react";
import type { RatingTone } from "@/lib/ats";
import { cn } from "@/lib/utils";

const TONE_GRADIENTS: Record<RatingTone, [string, string]> = {
  high: ["#34d399", "#38bdf8"],
  mid: ["#fbbf24", "#fb923c"],
  low: ["#fb7185", "#f43f5e"],
};

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

interface ScoreRingProps {
  value: number;
  tone?: RatingTone;
  size?: number;
  strokeWidth?: number;
  className?: string;
  sublabel?: string;
}

export function ScoreRing({
  value,
  tone = "mid",
  size = 180,
  strokeWidth = 13,
  className,
}: ScoreRingProps) {
  const gradientId = useId();
  const [from, to] = TONE_GRADIENTS[tone];
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 950;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(value * easeOutCubic(progress)));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 100) / 100);

  return (
    <div
      className={cn("relative inline-block", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        role="img"
        aria-label={`ATS fit score ${value} out of 100`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1.05s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum text-5xl font-bold tracking-tight text-white">
          {display}
        </span>
        <span className="text-xs font-medium text-white/45">/ 100</span>
      </div>
    </div>
  );
}
