import { type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-[var(--control-gap)] px-[var(--space-list-x)] py-[var(--space-8)] text-center",
        className,
      )}
    >
      {icon ? <div className="text-[var(--text-tertiary)]">{icon}</div> : null}
      <p className="text-[var(--text-primary)] [font-weight:var(--font-weight-emphasis)]">
        {title}
      </p>
      {description ? <p className="text-[var(--text-secondary)]">{description}</p> : null}
      {action}
    </div>
  );
}
