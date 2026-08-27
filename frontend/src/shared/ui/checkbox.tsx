import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { type ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { CONTROL_DISABLED, FOCUS_RING, ICON_CLASS } from "@/shared/ui/metrics";

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "flex h-[var(--control-height)] w-[var(--control-height)] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-input)] data-[state=checked]:border-[var(--accent)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:text-[var(--accent-contrast)]",
        CONTROL_DISABLED,
        FOCUS_RING,
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check className={ICON_CLASS} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
