import { useTranslation } from "react-i18next";
import type { TranscriptStatus } from "@/features/conversations/model/report";
import { Button, Spinner } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

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
  return (
    <section
      className="rounded-[var(--radius-md)] bg-[var(--surface-hover)] px-[var(--space-3)] py-[var(--space-2)]"
      data-transcript-status={status}
    >
      {status === "pending" ? (
        <div className="flex items-center gap-[var(--control-gap-tight)] text-[var(--text-secondary)]">
          <Spinner label={t("transcript.pending")} />
          <span>{t("transcript.pending")}</span>
        </div>
      ) : null}
      {status === "failed" ? (
        <div className="flex flex-col gap-[var(--space-2)]">
          <p className="text-[var(--status-danger)]">{t("transcript.failed")}</p>
          {onRetry ? (
            <Button onClick={onRetry} type="button" variant="ghost">
              {t("transcript.retry")}
            </Button>
          ) : null}
        </div>
      ) : null}
      {status === "ready" ? (
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
