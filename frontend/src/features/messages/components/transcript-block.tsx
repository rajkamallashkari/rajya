import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TranscriptStatus } from "@/features/conversations/model/report";
import { TRANSCRIPT_PENDING_TIMEOUT_MS } from "@/features/media/model/constants";
import { Button, Spinner } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

// The server stops calling a transcript pending once it goes stale, but nothing
// pushes that change to an open thread. Give up locally on the same deadline so
// the spinner cannot outlive the work it stands for.
function useStalled(pending: boolean): boolean {
  const [stalled, setStalled] = useState(false);
  useEffect(() => {
    setStalled(false);
    if (!pending) {
      return;
    }
    const timer = window.setTimeout(() => setStalled(true), TRANSCRIPT_PENDING_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [pending]);
  return stalled;
}

export function TranscriptBlock({
  language,
  onRetry,
  status,
  text,
}: {
  language: string | null;
  onRetry?: () => void;
  status: TranscriptStatus;
  text: string | null;
}) {
  const { t } = useTranslation();
  const stalled = useStalled(status === "pending");
  const shown: TranscriptStatus = stalled ? "failed" : status;
  return (
    <section
      className="rounded-[var(--radius-md)] bg-[var(--surface-hover)] px-[var(--space-3)] py-[var(--space-2)]"
      data-transcript-status={shown}
    >
      {shown === "pending" ? (
        <div className="flex items-center gap-[var(--control-gap-tight)] text-[var(--text-secondary)]">
          <Spinner label={t("transcript.pending")} />
          <span>{t("transcript.pending")}</span>
        </div>
      ) : null}
      {shown === "failed" ? (
        <div className="flex flex-col gap-[var(--space-2)]">
          <p className="text-[var(--status-danger)]">{t("transcript.failed")}</p>
          {onRetry ? (
            <Button onClick={onRetry} type="button" variant="ghost">
              {t("transcript.retry")}
            </Button>
          ) : null}
        </div>
      ) : null}
      {shown === "ready" ? (
        <div className="flex flex-col gap-[var(--space-1)]">
          <p className={WEIGHT_EMPHASIS}>
            {language ? t("transcript.ready_language", { language }) : t("transcript.ready")}
          </p>
          <p className="text-[var(--text-primary)]">{text ?? ""}</p>
        </div>
      ) : null}
    </section>
  );
}
