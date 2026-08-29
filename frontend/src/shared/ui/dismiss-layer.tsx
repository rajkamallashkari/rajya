import { cn } from "@/shared/lib/cn";
import { OVERLAY_SCRIM } from "@/shared/ui/metrics";

export function DismissLayer({
  className,
  label,
  onDismiss,
  scrim = false,
}: {
  className?: string;
  label: string;
  onDismiss: () => void;
  scrim?: boolean;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "fixed inset-0 z-[var(--z-sheet)] cursor-default border-0 p-0",
        scrim
          ? cn(OVERLAY_SCRIM, "hover:bg-[var(--overlay-scrim)]")
          : "bg-transparent hover:bg-transparent",
        className,
      )}
      data-dismiss-layer={scrim ? "scrim" : "clear"}
      onClick={onDismiss}
      type="button"
    />
  );
}
