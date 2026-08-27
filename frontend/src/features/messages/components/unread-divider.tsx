import { useTranslation } from "react-i18next";

export function UnreadDivider() {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center gap-[var(--space-3)] py-[var(--space-3)]"
      data-unread-divider=""
      role="separator"
    >
      <span className="h-[var(--hairline)] flex-1 bg-[var(--status-danger)]" />
      <span className="text-[length:var(--text-xs)] text-[var(--status-danger)]">
        {t("messages.unread")}
      </span>
      <span className="h-[var(--hairline)] flex-1 bg-[var(--status-danger)]" />
    </div>
  );
}
