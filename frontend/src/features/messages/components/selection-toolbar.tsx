import { Copy, Forward, Star, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, IconButton } from "@/shared/ui";
import { ICON_CLASS, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function SelectionToolbar({
  count,
  onClear,
  onCopy,
  onDelete,
  onForward,
  onSave,
  onSelectAll,
}: {
  count: number;
  onClear: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onForward: () => void;
  onSave: () => void;
  onSelectAll: () => void;
}) {
  const { t } = useTranslation();
  if (count <= 0) {
    return null;
  }
  return (
    <div
      className="flex min-h-[var(--control-height)] items-center gap-[var(--space-1)] bg-[var(--surface-panel)] px-[var(--space-list-x)] py-[var(--space-2)] shadow-[var(--elevation-1)]"
      data-selection-toolbar=""
      role="toolbar"
    >
      <IconButton aria-label={t("selection.clear")} onClick={onClear} type="button">
        <X className={ICON_CLASS} />
      </IconButton>
      <p className={WEIGHT_EMPHASIS}>{t("selection.selected", { count })}</p>
      <div className="ml-auto flex items-center gap-[var(--space-1)]">
        <Button onClick={onSelectAll} size="sm" type="button" variant="ghost">
          {t("selection.select_all")}
        </Button>
        <IconButton aria-label={t("selection.copy")} onClick={onCopy} type="button">
          <Copy className={ICON_CLASS} />
        </IconButton>
        <IconButton aria-label={t("selection.forward")} onClick={onForward} type="button">
          <Forward className={ICON_CLASS} />
        </IconButton>
        <IconButton aria-label={t("selection.save")} onClick={onSave} type="button">
          <Star className={ICON_CLASS} />
        </IconButton>
        <IconButton aria-label={t("selection.delete")} onClick={onDelete} type="button">
          <Trash2 className={ICON_CLASS} />
        </IconButton>
      </div>
    </div>
  );
}
