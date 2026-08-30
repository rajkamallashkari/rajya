export const OUTBOX_SYNC_TAG = "outbox-sync";
export const SW_CACHE_PREFIX = "rajya-";
export const SW_CACHE_NAME = `${SW_CACHE_PREFIX}v1`;
export const APP_SHELL_URLS = ["/", "/manifest.json", "/favicon.ico"] as const;
export const IMMUTABLE_ASSET = /\/assets\/.*\.(js|css|woff2?|ttf|otf|eot)(\?.*)?$/;
export const API_PREFIX = "/api/";
export const CABLE_PREFIX = "/cable";

export function isHttpGet(method: string, protocol: string): boolean {
  return method === "GET" && (protocol === "http:" || protocol === "https:");
}

export function shouldBypass(pathname: string): boolean {
  return pathname.startsWith(API_PREFIX) || pathname.startsWith(CABLE_PREFIX);
}

export function isImmutableAsset(pathname: string): boolean {
  return IMMUTABLE_ASSET.test(pathname);
}

export function isOwnCache(cacheName: string): boolean {
  return cacheName.startsWith(SW_CACHE_PREFIX);
}

export function staleCaches(keys: string[]): string[] {
  return keys.filter((key) => key !== SW_CACHE_NAME && isOwnCache(key));
}
