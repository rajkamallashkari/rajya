import { type InputHTMLAttributes, type Ref } from "react";
import { cn } from "@/shared/lib/cn";
import { CONTROL_DISABLED, CONTROL_SURFACE, FOCUS_RING } from "@/shared/ui/metrics";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

export function Input({ className, type = "text", ref, ...props }: InputProps) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-[var(--control-height)] w-full px-[var(--control-pad-x-sm)]",
        CONTROL_SURFACE,
        FOCUS_RING,
        "placeholder:text-[var(--text-tertiary)]",
        CONTROL_DISABLED,
        className,
      )}
      {...props}
    />
  );
}
