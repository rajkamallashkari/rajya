import { useTranslation } from "react-i18next";
import type { SystemEventKey } from "@/features/messages/model/constants";

export function SystemMessage({
  eventKey,
  values,
}: {
  eventKey: SystemEventKey;
  values?: Record<string, string | number>;
}) {
  const { t } = useTranslation();
  return (
    <p
      className="px-[var(--space-4)] py-[var(--space-3)] text-center text-[length:var(--text-sm)] text-[var(--text-tertiary)]"
      data-system-message={eventKey}
    >
      {t(`messages.system.${eventKey}`, values)}
    </p>
  );
}
