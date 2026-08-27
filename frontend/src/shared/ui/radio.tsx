import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { type ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { CONTROL_DISABLED, FOCUS_RING } from "@/shared/ui/metrics";

export function RadioGroup({
  className,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-[var(--control-gap-tight)]", className)}
      {...props}
    />
  );
}

export function RadioGroupItem({
  className,
  ...props
}: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        "flex h-[var(--control-height)] w-[var(--control-height)] items-center justify-center rounded-[var(--radius-full)] border border-[var(--border-default)] bg-[var(--surface-input)] data-[state=checked]:border-[var(--accent)]",
        CONTROL_DISABLED,
        FOCUS_RING,
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="h-[var(--radio-dot-size)] w-[var(--radio-dot-size)] rounded-[var(--radius-full)] bg-[var(--accent)]" />
    </RadioGroupPrimitive.Item>
  );
}
