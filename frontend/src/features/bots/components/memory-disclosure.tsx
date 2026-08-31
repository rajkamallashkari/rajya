import { useTranslation } from "react-i18next";

export function MemoryDisclosure() {
  const { t } = useTranslation();
  return (
    <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]" data-memory-disclosure="">
      {t("bots.memory_disclosure")}
    </p>
  );
}

export function MemoryNotice() {
  const { t } = useTranslation();
  return (
    <p
      className="rounded-[var(--radius-md)] bg-[var(--status-info-subtle)] px-[var(--space-3)] py-[var(--space-3)] text-[length:var(--text-sm)] text-[var(--text-secondary)]"
      data-memory-notice=""
    >
      {t("bots.memory_notice")}
    </p>
  );
}
