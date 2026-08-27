import {
  registerServiceWorkerListeners,
  type ServiceWorkerScope,
} from "@/shared/lib/pwa/register-listeners";

const worker = self as unknown as ServiceWorkerScope & {
  caches: CacheStorage;
  fetch: typeof fetch;
};
registerServiceWorkerListeners(worker, worker.caches, worker.fetch);
