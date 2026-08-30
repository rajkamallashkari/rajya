import { OUTBOX_SYNC_TAG } from "@/shared/lib/pwa/constants";

export function registerOutboxSync(
  registrar: Pick<Navigator, "serviceWorker"> | undefined = globalThis.navigator,
): void {
  if (!registrar?.serviceWorker) {
    return;
  }
  void registrar.serviceWorker.ready
    .then((registration) => {
      const syncManager = (
        registration as ServiceWorkerRegistration & {
          sync?: { register: (tag: string) => Promise<void> };
        }
      ).sync;
      if (!syncManager) {
        return undefined;
      }
      return syncManager.register(OUTBOX_SYNC_TAG);
    })
    .catch(() => undefined);
}
