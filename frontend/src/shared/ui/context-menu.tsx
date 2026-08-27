import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { type ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { MENU_CONTENT_CLASS, MENU_ITEM_CLASS } from "@/shared/ui/metrics";

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuSeparator = ContextMenuPrimitive.Separator;

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
