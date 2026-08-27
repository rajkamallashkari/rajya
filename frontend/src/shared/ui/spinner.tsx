import { type HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
}

export function Spinner({ className, label, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "ui-spinner h-[var(--space-6)] w-[var(--space-6)] rounded-[var(--radius-full)] border-[length:var(--spinner-border-width)] border-[var(--border-subtle)] border-t-[var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}
