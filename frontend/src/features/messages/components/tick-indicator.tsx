import { CircleX } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TickStatus } from "@/features/messages/model/constants";
import { cn } from "@/shared/lib/cn";
import { IconButton } from "@/shared/ui";

const TICK_CLASS = "h-[var(--tick-size)] w-[var(--tick-size)]";

function SingleTick({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={cn(TICK_CLASS, className)} fill="none" viewBox="0 0 16 16">
      <path
        d="M3 8.5 6.2 12 13 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function DoubleTick({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={cn(TICK_CLASS, className)}
      fill="currentColor"
      viewBox="0 26 100 48"
    >
      <path d="M68.241,32.231l-40.42,40.603c-1.549,1.557-4.057,1.555-5.604-0.004L2.091,52.566c-0.773-0.779-0.773-2.045,0-2.824l2.805-2.822c0.773-0.779,2.029-0.779,2.803,0L23.669,63c0.773,0.779,2.029,0.779,2.803,0l36.166-36.416c0.773-0.779,2.029-0.779,2.803,0l2.803,2.822C69.019,30.188,69.017,31.452,68.241,32.231z M98.938,29.407l-2.762-2.822c-0.762-0.779-2-0.779-2.762,0L57.778,63c-0.764,0.779-2,0.779-2.764,0l-2.857-2.92c-0.762-0.779-1.998-0.781-2.762-0.002l-2.766,2.818c-0.764,0.779-0.766,2.045-0.002,2.826l6.957,7.107c1.523,1.559,3.996,1.561,5.521,0.004l39.829-40.603C99.701,31.452,99.701,30.186,98.938,29.407z" />
    </svg>
  );
}

export function TickIndicator({ status, onRetry }: { status: TickStatus; onRetry?: () => void }) {
  const { t } = useTranslation();

  if (status === "queued") {
    return null;
  }

  if (status === "failed") {
    return (
      <IconButton
        aria-label={t("messages.ticks.failed")}
        className="min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] text-[var(--status-danger)]"
        onClick={onRetry}
        variant="ghost"
      >
        <CircleX className={TICK_CLASS} />
      </IconButton>
    );
  }

  const label =
    status === "sent"
      ? t("messages.ticks.sent")
      : status === "delivered"
        ? t("messages.ticks.delivered")
        : t("messages.ticks.read");
  const color = status === "read" ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]";

  return (
    <span
      aria-label={label}
      className={cn(
        "inline-flex transition-colors duration-[var(--motion-fast)] ease-[var(--ease-out)]",
        color,
      )}
      data-tick={status}
      role="img"
    >
      {status === "sent" ? <SingleTick /> : <DoubleTick />}
    </span>
  );
}
