import { Clock, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { Button, IconButton } from "@/shared/ui";
import { ICON_CLASS, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export interface ComposerAttachment {
  id: string;
  name: string;
}

export function ComposerScheduleBar({
  label,
  onClear,
  onOpen,
}: {
  label: string;
  onClear?: () => void;
  onOpen?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center gap-[var(--control-gap-tight)] border-t border-[var(--border-subtle)] bg-[var(--surface-hover)] px-[var(--space-4)] py-[var(--space-2)]"
      data-composer-schedule=""
    >
      <Clock className={cn(ICON_CLASS, "text-[var(--accent)]")} />
      <Button
        className={cn("min-w-0 flex-1 justify-start truncate", WEIGHT_EMPHASIS)}
        onClick={onOpen}
        variant="ghost"
      >
        {t("composer.scheduled", { when: label })}
      </Button>
      <IconButton aria-label={t("composer.clear_schedule")} onClick={onClear}>
        <X className={ICON_CLASS} />
      </IconButton>
    </div>
  );
}

export function ComposerAttachmentChips({
  attachments,
  onRemove,
}: {
  attachments: ComposerAttachment[];
  onRemove?: (id: string) => void;
}) {
  const { t } = useTranslation();
  if (attachments.length === 0) {
    return null;
  }
  return (
    <div
      className="flex min-w-0 items-center gap-[var(--control-gap-tight)] overflow-x-auto border-t border-[var(--border-subtle)] px-[var(--space-4)] py-[var(--space-2)]"
      data-composer-attachments=""
    >
      {attachments.map((file) => (
        <span
          className="inline-flex shrink-0 items-center gap-[var(--space-1)] rounded-[var(--control-radius)] bg-[var(--surface-hover)] pr-[var(--space-1)] pl-[var(--space-2)] text-[length:var(--text-xs)] whitespace-nowrap"
          key={file.id}
        >
          {file.name}
          <IconButton
            aria-label={t("composer.remove_attachment", { name: file.name })}
            onClick={() => onRemove?.(file.id)}
          >
            <X className={ICON_CLASS} />
          </IconButton>
        </span>
      ))}
    </div>
  );
}
