import { describe, expect, it } from "vitest";
import {
  isHttpGet,
  isImmutableAsset,
  isNavigationRequest,
  isOwnCache,
  isStaticPublicAsset,
  offlineShellResponse,
  OUTBOX_SYNC_TAG,
  shouldBypass,
  staleCaches,
  SW_CACHE_NAME,
  SW_CACHE_PREFIX,
  SW_OFFLINE_STATUS,
} from "./constants";

describe("pwa constants", () => {
  it("classifies requests and caches", () => {
    expect(OUTBOX_SYNC_TAG).toBe("outbox-sync");
    expect(isHttpGet("POST", "https:")).toBe(false);
    expect(isHttpGet("GET", "ws:")).toBe(false);
    expect(shouldBypass("/api/v1/health")).toBe(true);
    expect(shouldBypass("/cable")).toBe(true);
    expect(shouldBypass("/")).toBe(false);
    expect(isImmutableAsset("/assets/app-abc.js")).toBe(true);
    expect(isImmutableAsset("/index.html")).toBe(false);
    expect(isOwnCache(`${SW_CACHE_PREFIX}old`)).toBe(true);
    expect(isOwnCache("other")).toBe(false);
    expect(staleCaches([SW_CACHE_NAME, `${SW_CACHE_PREFIX}old`, "other"])).toEqual([
      `${SW_CACHE_PREFIX}old`,
    ]);
    expect(SW_CACHE_NAME).toBe("rajya-v1");
    expect(isStaticPublicAsset("/icons/icon-192.png")).toBe(true);
    expect(isStaticPublicAsset("/manifest.json")).toBe(true);
    expect(isStaticPublicAsset("/favicon.ico")).toBe(true);
    expect(isStaticPublicAsset("/index.html")).toBe(false);
    expect(isNavigationRequest({ mode: "navigate" } as Request)).toBe(true);
    expect(isNavigationRequest({ mode: "cors" } as Request)).toBe(false);
    expect(offlineShellResponse().status).toBe(SW_OFFLINE_STATUS);
  });
});
