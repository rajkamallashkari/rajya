import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { type ComponentProps, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { POPOVER_OFFSET_PX, TOOLTIP_DELAY_MS } from "@/shared/ui/metrics";

export function TooltipProvider({
  delayDuration = TOOLTIP_DELAY_MS,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = POPOVER_OFFSET_PX,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-[var(--z-popover)] rounded-[var(--radius-md)] bg-[var(--surface-raised)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--text-primary)] shadow-[var(--elevation-2)] ui-popover",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

export function SimpleTooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  );
}
