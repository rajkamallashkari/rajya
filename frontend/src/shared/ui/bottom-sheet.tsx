import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { IconButton } from "@/shared/ui/icon-button";
import { ICON_CLASS, OVERLAY_SCRIM } from "@/shared/ui/metrics";

export const BottomSheet = DialogPrimitive.Root;
export const BottomSheetTrigger = DialogPrimitive.Trigger;
export const BottomSheetClose = DialogPrimitive.Close;
export const BottomSheetTitle = DialogPrimitive.Title;
export const BottomSheetDescription = DialogPrimitive.Description;

export function BottomSheetContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  const { t } = useTranslation();
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={cn(OVERLAY_SCRIM, "z-[var(--z-sheet)]")} />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-[var(--z-sheet)] flex min-h-[var(--sheet-min-height)] max-h-[var(--sheet-max-height)] flex-col rounded-t-[var(--radius-xl)] bg-[var(--surface-panel)] pb-[var(--safe-area-bottom)] shadow-[var(--elevation-3)] ui-sheet",
          className,
        )}
        {...props}
      >
        <div className="flex justify-center pt-[var(--space-2)]">
          <span className="h-[var(--space-1)] w-[var(--sheet-handle-width)] rounded-[var(--radius-full)] bg-[var(--border-strong)]" />
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-[var(--control-pad-x)] py-[var(--control-pad-x)]">
          {children}
        </div>
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
