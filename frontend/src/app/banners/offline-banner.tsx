import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useConnectionState } from "@/shared/hooks/use-connection-state";

export function OfflineBanner({ force = false }: { force?: boolean } = {}): ReactNode {
  const { t } = useTranslation();
  const { isDisconnected, isOnline, labelKey } = useConnectionState();
  if (!force && isOnline && !isDisconnected) {
    return null;
  }
  return (
    <div
      className="bg-[var(--surface-raised)] px-[var(--space-list-x)] py-[var(--space-2)] text-center text-[length:var(--text-sm)] text-[var(--text-secondary)]"
      data-offline-banner=""
      role="status"
    >
      {t(force ? "offline.banner" : labelKey)}
    </div>
  );
}
