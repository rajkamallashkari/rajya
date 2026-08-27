import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { type ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import {
  CONTROL_DISABLED,
  CONTROL_SURFACE,
  FOCUS_RING,
  ICON_CLASS,
  MENU_CONTENT_CLASS,
  MENU_ITEM_CLASS,
} from "@/shared/ui/metrics";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;
export const SelectGroup = SelectPrimitive.Group;

export function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "inline-flex min-h-[var(--control-height)] w-full items-center justify-between gap-[var(--control-gap-tight)] px-[var(--control-pad-x-sm)]",
        CONTROL_SURFACE,
        FOCUS_RING,
        CONTROL_DISABLED,
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown className={cn(ICON_CLASS, "text-[var(--text-tertiary)]")} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        className={cn(MENU_CONTENT_CLASS, "ui-popover", className)}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-[var(--space-1)]">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item className={cn(MENU_ITEM_CLASS, "justify-between", className)} {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator>
        <Check className={cn(ICON_CLASS, "text-[var(--accent)]")} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
