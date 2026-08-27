import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { IconButton } from "@/shared/ui/icon-button";
import { ICON_CLASS, OVERLAY_SCRIM } from "@/shared/ui/metrics";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export const DrawerTitle = DialogPrimitive.Title;
export const DrawerDescription = DialogPrimitive.Description;

export type DrawerSide = "left" | "right";

export function DrawerContent({
  className,
  children,
  side = "right",
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { side?: DrawerSide }) {
  const { t } = useTranslation();
  const fromLeft = side === "left";
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={cn(OVERLAY_SCRIM, "z-[var(--z-drawer)]")} />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-y-0 z-[var(--z-drawer)] flex w-[min(var(--drawer-width),100%)] flex-col bg-[var(--surface-panel)] shadow-[var(--elevation-3)]",
          fromLeft ? "left-0 ui-drawer-left" : "right-0 ui-drawer-right",
          className,
        )}
        {...props}
      >
        <div className="flex-1 overflow-auto p-[var(--control-pad-x)]">{children}</div>
        <DialogPrimitive.Close asChild>
          <IconButton
            aria-label={t("ui.close")}
            className="absolute top-[var(--close-offset)] right-[var(--close-offset)]"
          >
            <X className={ICON_CLASS} />
          </IconButton>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
