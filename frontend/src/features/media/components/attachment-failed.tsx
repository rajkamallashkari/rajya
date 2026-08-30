import { useTranslation } from "react-i18next";
import { RotateCw } from "lucide-react";
import { aspectStyle } from "@/features/media/model/constants";
import type { Attachment } from "@/features/media/model/constants";
import { Button } from "@/shared/ui";
import { ICON_CLASS } from "@/shared/ui/metrics";

export function AttachmentFailed({
  attachment,
  onRetry,
}: {
  attachment: Attachment;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="flex flex-col items-center justify-center gap-[var(--space-2)] bg-[var(--surface-input)] px-[var(--space-3)] py-[var(--space-4)]"
      data-attachment-failed=""
      style={aspectStyle(attachment.width, attachment.height)}
    >
      <p className="text-center text-[length:var(--text-sm)] text-[var(--status-danger)]">
        {attachment.processing_error ?? t("media.failed")}
      </p>
      {onRetry ? (
        <Button onClick={onRetry} type="button" variant="secondary">
          <RotateCw className={ICON_CLASS} />
          {t("media.retry")}
        </Button>
      ) : null}
    </div>
  );
}
