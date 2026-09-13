import { RotateCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui";
import { ICON_CLASS } from "@/shared/ui/metrics";

export function AttachmentStalled({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center gap-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--text-secondary)]"
      data-attachment-stalled=""
    >
      <span>{t("media.stalled")}</span>
      <Button className="h-auto px-[var(--space-1)] py-0" onClick={onRetry} type="button" variant="ghost">
        <RotateCw className={ICON_CLASS} />
        {t("media.retry")}
      </Button>
    </div>
  );
}
