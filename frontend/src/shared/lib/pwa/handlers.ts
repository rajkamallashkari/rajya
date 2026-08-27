import {
  APP_SHELL_URLS,
  isHttpGet,
  isImmutableAsset,
  shouldBypass,
  staleCaches,
  SW_CACHE_NAME,
} from "./constants";

export interface CacheLike {
  match: (request: RequestInfo) => Promise<Response | undefined>;
  put: (request: RequestInfo, response: Response) => Promise<void>;
  addAll: (urls: readonly string[]) => Promise<void>;
}

export interface CachesLike {
  open: (name: string) => Promise<CacheLike>;
  keys: () => Promise<string[]>;
  delete: (name: string) => Promise<boolean>;
}

export interface FetchEventLike {
  request: Request;
  respondWith: (response: Promise<Response> | Response) => void;
}

export interface ExtendableEventLike {
  waitUntil: (promise: Promise<unknown>) => void;
}

export async function precacheShell(cacheStorage: CachesLike): Promise<void> {
  const cache = await cacheStorage.open(SW_CACHE_NAME);
  await cache.addAll(APP_SHELL_URLS);
}

export async function dropStaleCaches(cacheStorage: CachesLike): Promise<void> {
  const keys = await cacheStorage.keys();
  await Promise.all(staleCaches(keys).map((key) => cacheStorage.delete(key)));
}

export async function cacheFirst(
  request: Request,
  cacheStorage: CachesLike,
  fetchImpl: typeof fetch,
): Promise<Response> {
  const cache = await cacheStorage.open(SW_CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetchImpl(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

export async function networkFirst(
  request: Request,
  cacheStorage: CachesLike,
  fetchImpl: typeof fetch,
): Promise<Response> {
  const cache = await cacheStorage.open(SW_CACHE_NAME);
  try {
    const response = await fetchImpl(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

export function handleFetch(
  event: FetchEventLike,
  cacheStorage: CachesLike,
  fetchImpl: typeof fetch,
): boolean {
  const url = new URL(event.request.url);
  if (!isHttpGet(event.request.method, url.protocol) || shouldBypass(url.pathname)) {
    return false;
  }
  if (isImmutableAsset(url.pathname)) {
    event.respondWith(cacheFirst(event.request, cacheStorage, fetchImpl));
    return true;
  }
  event.respondWith(networkFirst(event.request, cacheStorage, fetchImpl));
  return true;
}

export function handleInstall(
  event: ExtendableEventLike,
  cacheStorage: CachesLike,
  skipWaiting: () => Promise<void>,
): void {
  event.waitUntil(precacheShell(cacheStorage).then(() => skipWaiting()));
}

export function handleActivate(
  event: ExtendableEventLike,
  cacheStorage: CachesLike,
  claim: () => Promise<void>,
): void {
  event.waitUntil(dropStaleCaches(cacheStorage).then(() => claim()));
}
