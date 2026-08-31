import { Mic, MicOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { ICON_CLASS } from "@/shared/ui/metrics";

export type MicStatus = "idle" | "muted" | "speaking";

export function MicStatusIcon({ status }: { status: MicStatus }) {
  const { t } = useTranslation();
  if (status === "muted") {
    return (
      <span
        aria-label={t("calls.mic_muted")}
        className="relative flex h-[var(--space-10)] w-[var(--space-10)] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--status-danger-subtle)] text-[var(--status-danger)]"
        role="img"
      >
        <MicOff aria-hidden className={ICON_CLASS} />
      </span>
    );
  }
  if (status === "speaking") {
    return (
      <span
        aria-label={t("calls.mic_speaking")}
        className="flex h-[var(--space-10)] w-[var(--space-10)] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--status-success-subtle)] text-[var(--status-success)]"
        role="img"
      >
        <Mic aria-hidden className={cn(ICON_CLASS, "animate-pulse")} />
      </span>
    );
  }
  return (
    <span
      aria-label={t("calls.mic_idle")}
      className="flex h-[var(--space-10)] w-[var(--space-10)] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--call-chrome-muted)] text-[var(--text-inverse)]"
      role="img"
    >
      <Mic aria-hidden className={ICON_CLASS} />
    </span>
  );
}
