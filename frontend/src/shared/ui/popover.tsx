import * as PopoverPrimitive from "@radix-ui/react-popover";
import { type ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { MENU_CONTENT_CLASS, POPOVER_OFFSET_PX } from "@/shared/ui/metrics";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

export function PopoverContent({
  className,
  align = "center",
  sideOffset = POPOVER_OFFSET_PX,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          MENU_CONTENT_CLASS,
          "z-[var(--z-popover)] p-[var(--space-3)] ui-popover",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
