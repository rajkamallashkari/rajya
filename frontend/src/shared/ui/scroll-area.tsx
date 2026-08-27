import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { type ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

export function ScrollArea({
  className,
  children,
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root className={cn("overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport className="h-full w-full">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

export function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  const vertical = orientation === "vertical";
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      orientation={orientation}
      className={cn(
        "flex touch-none p-[var(--hairline)] select-none",
        vertical ? "h-full w-[var(--space-2)]" : "h-[var(--space-2)] w-full flex-col",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-[var(--radius-full)] bg-[var(--scrollbar-thumb)]" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}
