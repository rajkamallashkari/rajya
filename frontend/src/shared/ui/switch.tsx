import * as SwitchPrimitive from "@radix-ui/react-switch";
import { type ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { FOCUS_RING } from "@/shared/ui/metrics";

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "inline-flex h-[var(--control-height)] w-[var(--switch-track-width)] items-center rounded-[var(--radius-full)] bg-[var(--surface-hover)] p-[var(--space-1)] data-[state=checked]:bg-[var(--accent)] disabled:opacity-[var(--opacity-disabled)]",
        FOCUS_RING,
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block h-[var(--switch-thumb-size)] w-[var(--switch-thumb-size)] rounded-[var(--radius-full)] bg-[var(--surface-raised)] shadow-[var(--elevation-1)] transition-transform duration-[var(--motion-fast)] ease-[var(--ease-out)] data-[state=checked]:translate-x-[var(--space-4)]" />
    </SwitchPrimitive.Root>
  );
}
