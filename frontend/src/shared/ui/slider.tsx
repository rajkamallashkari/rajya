import * as SliderPrimitive from "@radix-ui/react-slider";
import { type ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { FOCUS_RING, PROGRESS_MAX, PROGRESS_MIN, SLIDER_STEP } from "@/shared/ui/metrics";

export function Slider({
  className,
  max = PROGRESS_MAX,
  min = PROGRESS_MIN,
  step = SLIDER_STEP,
  "aria-label": ariaLabel,
  ...props
}: ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      min={min}
      max={max}
      step={step}
      className={cn(
        "relative flex min-h-[var(--control-height)] w-full touch-none items-center select-none",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-[var(--space-1)] w-full grow rounded-[var(--radius-full)] bg-[var(--surface-hover)]">
        <SliderPrimitive.Range className="absolute h-full rounded-[var(--radius-full)] bg-[var(--accent)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={ariaLabel}
        className={cn(
          "block h-[var(--slider-thumb-size)] w-[var(--slider-thumb-size)] rounded-[var(--radius-full)] bg-[var(--accent)] shadow-[var(--elevation-1)]",
          FOCUS_RING,
        )}
      />
    </SliderPrimitive.Root>
  );
}
