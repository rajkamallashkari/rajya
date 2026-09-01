import { describe, expect, it, vi } from "vitest";
import {
  cacheFirst,
  dropStaleCaches,
  handleActivate,
  handleFetch,
  handleInstall,
  handleOutboxSync,
  networkFirst,
  precacheShell,
  type CacheLike,
  type CachesLike,
} from "./handlers";
import { OUTBOX_SYNC_TAG, SW_CACHE_NAME, SW_CACHE_PREFIX } from "./constants";

function createCaches(initial?: Record<string, Response>): {
  caches: CachesLike;
  store: Map<string, Map<string, Response>>;
} {
  const store = new Map<string, Map<string, Response>>();
  if (initial) {
    store.set(SW_CACHE_NAME, new Map(Object.entries(initial)));
  }
  const caches: CachesLike = {
    open: async (name) => {
      if (!store.has(name)) {
        store.set(name, new Map());
      }
      const bucket = store.get(name) as Map<string, Response>;
      const cache: CacheLike = {
        match: async (request) => bucket.get(typeof request === "string" ? request : request.url),
        put: async (request, response) => {
          bucket.set(typeof request === "string" ? request : request.url, response);
        },
        addAll: async (urls) => {
          for (const url of urls) {
            bucket.set(url, new Response("shell", { status: 200 }));
          }
        },
      };
      return cache;
    },
    keys: async () => [...store.keys()],
    delete: async (name) => store.delete(name),
  };
  return { caches, store };
}

describe("pwa handlers", () => {
  it("precache and drops stale caches", async () => {
    const { caches, store } = createCaches();
    store.set(`${SW_CACHE_PREFIX}old`, new Map());
    await precacheShell(caches);
    await dropStaleCaches(caches);
    expect(store.has(SW_CACHE_NAME)).toBe(true);
    expect(store.has(`${SW_CACHE_PREFIX}old`)).toBe(false);
  });

  it("uses cache-first and skips storing failed responses", async () => {
    const request = new Request("https://app.test/assets/app.js");
    const { caches } = createCaches({ "https://app.test/assets/app.js": new Response("cached") });
    const cached = await cacheFirst(request, caches, vi.fn());
    expect(await cached.text()).toBe("cached");

    const { caches: empty } = createCaches();
    const ok = await cacheFirst(
      new Request("https://app.test/assets/b.js"),
      empty,
      async () => new Response("fresh", { status: 200 }),
    );
    expect(await ok.text()).toBe("fresh");

    const failed = await cacheFirst(
      new Request("https://app.test/assets/c.js"),
      createCaches().caches,
      async () => new Response("nope", { status: 500 }),
    );
    expect(failed.status).toBe(500);
  });

  it("uses network-first with cache fallback", async () => {
    const request = new Request("https://app.test/");
    const live = await networkFirst(
      request,
      createCaches().caches,
      async () => new Response("live", { status: 200 }),
    );
    expect(await live.text()).toBe("live");

    const failedLive = await networkFirst(
      request,
      createCaches().caches,
      async () => new Response("nope", { status: 500 }),
    );
    expect(failedLive.status).toBe(500);

    const { caches } = createCaches({ "https://app.test/": new Response("offline") });
    const offline = await networkFirst(request, caches, async () => {
      throw new Error("offline");
    });
    expect(await offline.text()).toBe("offline");

    const missing = await networkFirst(
      new Request("https://app.test/missing"),
      createCaches().caches,
      async () => {
        throw new Error("offline");
      },
    );
    expect(missing.status).toBe(503);

    const navigateRequest = new Request("https://app.test/c/1");
    Object.defineProperty(navigateRequest, "mode", { configurable: true, value: "navigate" });
    const navigated = await networkFirst(
      navigateRequest,
      createCaches({ "/": new Response("shell") }).caches,
      async () => {
        throw new Error("offline");
      },
    );
    expect(await navigated.text()).toBe("shell");
  });

  it("routes fetch/install/activate events", async () => {
    const { caches } = createCaches();
    const respondWith = vi.fn();
    expect(
      handleFetch(
        { request: new Request("https://app.test/api/v1/up"), respondWith },
        caches,
        fetch,
      ),
    ).toBe(false);
    expect(
      handleFetch(
        { request: new Request("https://app.test/", { method: "POST" }), respondWith },
        caches,
        fetch,
      ),
    ).toBe(false);
    expect(
      handleFetch(
        { request: new Request("https://app.test/assets/app.js"), respondWith },
        caches,
        async () => new Response("js", { status: 200 }),
      ),
    ).toBe(true);
    expect(
      handleFetch(
        { request: new Request("https://app.test/icons/icon-192.png"), respondWith },
        caches,
        async () => new Response("icon", { status: 200 }),
      ),
    ).toBe(true);
    expect(
      handleFetch(
        { request: new Request("https://app.test/"), respondWith },
        caches,
        async () => new Response("html", { status: 200 }),
      ),
    ).toBe(true);

    const waitUntil = vi.fn(async (promise: Promise<unknown>) => promise);
    handleInstall({ waitUntil }, caches, async () => undefined);
    handleActivate({ waitUntil }, caches, async () => undefined);
    expect(waitUntil).toHaveBeenCalledTimes(2);
    const drain = vi.fn(async () => undefined);
    expect(handleOutboxSync({ tag: "other", waitUntil }, drain)).toBe(false);
    expect(
      handleOutboxSync({ tag: OUTBOX_SYNC_TAG, lastChance: true, waitUntil }, drain),
    ).toBe(true);
    expect(drain).toHaveBeenCalledWith(true);
  });
});
