import { drainFromServiceWorker } from "@/shared/lib/outbox/worker";
import {
  registerServiceWorkerListeners,
  type ServiceWorkerScope,
} from "@/shared/lib/pwa/register-listeners";

interface WorkerClients {
  matchAll: (options?: { includeUncontrolled?: boolean }) => Promise<
    Array<{ postMessage: (data: unknown) => void }>
  >;
}

const worker = self as unknown as ServiceWorkerScope & {
  caches: CacheStorage;
  clients: WorkerClients;
  fetch: typeof fetch;
};

function postToClients(data: unknown): void {
  void worker.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      client.postMessage(data);
    }
  });
}

registerServiceWorkerListeners(worker, worker.caches, worker.fetch, (lastChance) =>
  drainFromServiceWorker({
    lastChance,
    postMessage: postToClients,
  }),
);
