import {
  handleActivate,
  handleFetch,
  handleInstall,
  handleOutboxSync,
  type CachesLike,
  type ExtendableEventLike,
  type FetchEventLike,
  type SyncEventLike,
} from "./handlers";
import {
  handleNotificationClick,
  handlePush,
  type NotificationClickEventLike,
  type PushClients,
  type PushEventLike,
  type ShowNotificationScope,
} from "./push-event";

export interface ServiceWorkerScope extends ShowNotificationScope {
  addEventListener: (type: string, listener: (event: Event) => void) => void;
  skipWaiting: () => Promise<void>;
  clients: PushClients & { claim: () => Promise<void> };
}

export function registerServiceWorkerListeners(
  scope: ServiceWorkerScope,
  cacheStorage: CachesLike,
  fetchImpl: typeof fetch,
  drain: (lastChance: boolean) => Promise<unknown> = async () => undefined,
): void {
  scope.addEventListener("install", (event) => {
    handleInstall(event as unknown as ExtendableEventLike, cacheStorage, () => scope.skipWaiting());
  });
  scope.addEventListener("activate", (event) => {
    handleActivate(event as unknown as ExtendableEventLike, cacheStorage, () =>
      scope.clients.claim(),
    );
  });
  scope.addEventListener("fetch", (event) => {
    handleFetch(event as unknown as FetchEventLike, cacheStorage, fetchImpl);
  });
  scope.addEventListener("sync", (event) => {
    handleOutboxSync(event as unknown as SyncEventLike, drain);
  });
  scope.addEventListener("push", (event) => {
    const pushEvent = event as unknown as PushEventLike;
    pushEvent.waitUntil(handlePush(pushEvent, scope));
  });
  scope.addEventListener("notificationclick", (event) => {
    const clickEvent = event as unknown as NotificationClickEventLike;
    clickEvent.waitUntil(handleNotificationClick(clickEvent, scope.clients));
  });
}
