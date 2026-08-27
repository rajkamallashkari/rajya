import { cva, type VariantProps } from "class-variance-authority";
import { type HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

const badgeVariants = cva(
  cn(
    "inline-flex min-h-[var(--badge-min-height)] items-center rounded-[var(--radius-full)] px-[var(--space-2)] py-[var(--space-0_5)] text-[length:var(--text-xs)]",
    WEIGHT_EMPHASIS,
  ),
  {
    variants: {
      variant: {
        accent: "bg-[var(--accent-subtle)] text-[var(--accent)]",
        muted: "bg-[var(--surface-hover)] text-[var(--text-secondary)]",
        success: "bg-[var(--status-success-subtle)] text-[var(--status-success)]",
        warning: "bg-[var(--status-warning-subtle)] text-[var(--status-warning)]",
        danger: "bg-[var(--status-danger-subtle)] text-[var(--status-danger)]",
      },
    },
    defaultVariants: {
      variant: "accent",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
