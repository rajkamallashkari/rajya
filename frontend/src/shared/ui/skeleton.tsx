import { type HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("ui-skeleton rounded-[var(--radius-md)] bg-[var(--surface-hover)]", className)}
      {...props}
    />
  );
}
