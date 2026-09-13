import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { forwardRef, type ComponentProps, type KeyboardEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { MENU_CONTENT_CLASS, MENU_ITEM_CLASS } from "@/shared/ui/metrics";

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuSeparator = ContextMenuPrimitive.Separator;

export const ContextMenuTrigger = forwardRef<
  HTMLSpanElement,
  ComponentProps<typeof ContextMenuPrimitive.Trigger>
>(function ContextMenuTrigger({ onKeyDown, ...props }, ref) {
  return (
    <ContextMenuPrimitive.Trigger
      {...props}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && isKeyboardContextMenu(event)) {
          event.preventDefault();
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.dispatchEvent(
            new MouseEvent("contextmenu", {
              bubbles: true,
              clientX: rect.left,
              clientY: rect.bottom,
            }),
          );
        }
      }}
      ref={ref}
    />
  );
});

function isKeyboardContextMenu(event: KeyboardEvent): boolean {
  return event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey);
}

export function ContextMenuContent({
  className,
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        className={cn(MENU_CONTENT_CLASS, "ui-popover", className)}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}

export function ContextMenuItem({
  className,
  ...props
}: ComponentProps<typeof ContextMenuPrimitive.Item>) {
  return <ContextMenuPrimitive.Item className={cn(MENU_ITEM_CLASS, className)} {...props} />;
}
