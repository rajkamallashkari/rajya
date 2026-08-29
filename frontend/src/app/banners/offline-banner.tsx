import { useSyncExternalStore, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

function subscribeOnline(onStoreChange: () => void): () => void {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

export function OfflineBanner({ force = false }: { force?: boolean } = {}): ReactNode {
  const { t } = useTranslation();
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
  if (online && !force) {
    return null;
  }
  return (
    <div
      className="bg-[var(--surface-raised)] px-[var(--space-list-x)] py-[var(--space-2)] text-center text-[length:var(--text-sm)] text-[var(--text-secondary)]"
      data-offline-banner=""
      role="status"
    >
      {t("offline.banner")}
    </div>
  );
}
