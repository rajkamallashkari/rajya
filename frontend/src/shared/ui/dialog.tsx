import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { IconButton } from "@/shared/ui/icon-button";
import { ICON_CLASS, OVERLAY_SCRIM } from "@/shared/ui/metrics";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogOverlay({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(OVERLAY_SCRIM, "z-[var(--z-modal)]", className)}
      {...props}
    />
  );
}

export function DialogContent({
  className,
  children,
  showClose = true,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { showClose?: boolean }) {
  const { t } = useTranslation();
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-[var(--z-modal)] w-[calc(100%-var(--space-8))] max-w-[var(--dialog-max-width)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] bg-[var(--surface-panel)] p-[var(--space-5)] shadow-[var(--elevation-3)] ui-dialog",
          className,
        )}
        {...props}
      >
        {children}
        {showClose ? (
          <DialogPrimitive.Close asChild>
            <IconButton
              aria-label={t("ui.close")}
              className="absolute top-[var(--close-offset)] right-[var(--close-offset)]"
            >
              <X className={ICON_CLASS} />
            </IconButton>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
