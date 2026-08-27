import { cn } from "@/shared/lib/cn";
import {
  PROGRESS_MAX,
  PROGRESS_MIN,
  PROGRESS_RING_RADIUS,
  PROGRESS_RING_STROKE,
} from "@/shared/ui/metrics";

export interface ProgressRingProps {
  value: number;
  label: string;
  className?: string;
}

export function clampProgress(value: number): number {
  if (value < PROGRESS_MIN) {
    return PROGRESS_MIN;
  }
  if (value > PROGRESS_MAX) {
    return PROGRESS_MAX;
  }
  return value;
}

export function ProgressRing({ value, label, className }: ProgressRingProps) {
  const clamped = clampProgress(value);
  const circumference = 2 * Math.PI * PROGRESS_RING_RADIUS;
  const offset = circumference - (clamped / PROGRESS_MAX) * circumference;
  const size = (PROGRESS_RING_RADIUS + PROGRESS_RING_STROKE) * 2;

  return (
    <svg
      role="progressbar"
      aria-label={label}
      aria-valuemin={PROGRESS_MIN}
      aria-valuemax={PROGRESS_MAX}
      aria-valuenow={clamped}
      viewBox={`0 0 ${size} ${size}`}
      className={cn(
        "h-[var(--progress-ring-size)] w-[var(--progress-ring-size)] -rotate-90",
        className,
      )}
    >
      <circle
        cx={PROGRESS_RING_RADIUS + PROGRESS_RING_STROKE}
        cy={PROGRESS_RING_RADIUS + PROGRESS_RING_STROKE}
        r={PROGRESS_RING_RADIUS}
        fill="none"
        stroke="var(--border-subtle)"
        strokeWidth={PROGRESS_RING_STROKE}
      />
      <circle
        cx={PROGRESS_RING_RADIUS + PROGRESS_RING_STROKE}
        cy={PROGRESS_RING_RADIUS + PROGRESS_RING_STROKE}
        r={PROGRESS_RING_RADIUS}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={PROGRESS_RING_STROKE}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}
