import { describe, expect, it, vi } from "vitest";
import { registerServiceWorkerListeners, type ServiceWorkerScope } from "./register-listeners";
import { registerServiceWorker } from "./register";

describe("service worker registration", () => {
  it("returns null when service workers are unavailable", async () => {
    await expect(registerServiceWorker({} as Navigator)).resolves.toBeNull();
    await expect(registerServiceWorker(undefined)).resolves.toBeNull();
  });

  it("registers /sw.js", async () => {
    const register = vi.fn().mockResolvedValue({ scope: "/" });
    await expect(
      registerServiceWorker({ serviceWorker: { register } } as unknown as Navigator),
    ).resolves.toEqual({ scope: "/" });
    expect(register).toHaveBeenCalledWith("/sw.js");
  });

  it("binds install, activate and fetch", () => {
    const listeners = new Map<string, (event: Event) => void>();
    const scope: ServiceWorkerScope = {
      addEventListener: (type, listener) => listeners.set(type, listener),
      skipWaiting: async () => undefined,
      clients: { claim: async () => undefined, matchAll: async () => [], openWindow: async () => null },
      registration: { showNotification: async () => undefined },
    };
    const caches = {
      open: async () => ({
        match: async () => undefined,
        put: async () => undefined,
        addAll: async () => undefined,
      }),
      keys: async () => [],
      delete: async () => true,
    };
    registerServiceWorkerListeners(scope, caches, async () => new Response("ok"));
    const waitUntil = vi.fn();
    const respondWith = vi.fn();
    listeners.get("install")?.({ waitUntil } as unknown as Event);
    listeners.get("activate")?.({ waitUntil } as unknown as Event);
    listeners.get("fetch")?.({
      request: new Request("https://app.test/"),
      respondWith,
    } as unknown as Event);
    listeners.get("sync")?.({ tag: "outbox-sync", waitUntil } as unknown as Event);
    listeners.get("push")?.({ data: { json: () => ({}) }, waitUntil } as unknown as Event);
    listeners.get("notificationclick")?.({
      notification: { close: () => undefined },
      waitUntil,
    } as unknown as Event);
    expect(listeners.size).toBe(6);
    expect(waitUntil).toHaveBeenCalled();
  });
});
