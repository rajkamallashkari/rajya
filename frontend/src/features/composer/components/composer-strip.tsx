import { Pencil, Reply, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { IconButton } from "@/shared/ui";
import { ICON_CLASS, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export interface ComposerReply {
  preview: string;
  senderName: string;
}

export function ComposerStrip({
  editing,
  onDismiss,
  replyTo,
}: {
  editing?: boolean;
  onDismiss: () => void;
  replyTo?: ComposerReply | null;
}) {
  const { t } = useTranslation();
  if (!editing && !replyTo) {
    return null;
  }
  const isEdit = Boolean(editing);
  const replyName = replyTo?.senderName ?? "";
  return (
    <div
      className="flex items-center gap-[var(--control-gap-tight)] border-t border-[var(--border-subtle)] bg-[var(--surface-hover)] px-[var(--space-4)] py-[var(--space-2)]"
      data-composer-strip={isEdit ? "edit" : "reply"}
    >
      {isEdit ? (
        <Pencil className={cn(ICON_CLASS, "text-[var(--status-warning)]")} />
      ) : (
        <Reply className={cn(ICON_CLASS, "text-[var(--accent)]")} />
      )}
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[length:var(--text-xs)]", WEIGHT_EMPHASIS)}>
          {isEdit ? t("composer.editing") : t("composer.replying", { name: replyName })}
        </p>
        {replyTo && !isEdit ? (
          <p className="truncate text-[length:var(--text-xs)] text-[var(--text-secondary)]">
            {replyTo.preview}
          </p>
        ) : null}
      </div>
      <IconButton
        aria-label={isEdit ? t("composer.dismiss_edit") : t("composer.dismiss_reply")}
        onClick={onDismiss}
      >
        <X className={ICON_CLASS} />
      </IconButton>
    </div>
  );
}
