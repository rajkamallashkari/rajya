import { type ComponentProps } from "react";
import { useMobileViewport } from "@/shared/hooks/use-mobile-viewport";
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "@/shared/ui/bottom-sheet";
import { DialogContent } from "@/shared/ui/dialog";

export const ResponsiveOverlay = BottomSheet;
export const ResponsiveOverlayTrigger = BottomSheetTrigger;
export const ResponsiveOverlayClose = BottomSheetClose;
export const ResponsiveOverlayTitle = BottomSheetTitle;
export const ResponsiveOverlayDescription = BottomSheetDescription;

export function ResponsiveOverlayContent({
  className,
  children,
  ...props
}: ComponentProps<typeof BottomSheetContent>) {
  const mobile = useMobileViewport();
  return mobile ? (
    <BottomSheetContent className={className} {...props}>
      {children}
    </BottomSheetContent>
  ) : (
    <DialogContent className={className} {...props}>
      {children}
    </DialogContent>
  );
}
