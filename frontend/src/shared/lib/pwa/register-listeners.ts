import {
  handleActivate,
  handleFetch,
  handleInstall,
  type CachesLike,
  type ExtendableEventLike,
  type FetchEventLike,
} from "./handlers";

export interface ServiceWorkerScope {
  addEventListener: (type: string, listener: (event: Event) => void) => void;
  skipWaiting: () => Promise<void>;
  clients: { claim: () => Promise<void> };
}

export function registerServiceWorkerListeners(
  scope: ServiceWorkerScope,
  cacheStorage: CachesLike,
  fetchImpl: typeof fetch,
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
}
