import { describe, expect, it } from "vitest";
import {
  isHttpGet,
  isImmutableAsset,
  isOwnCache,
  OUTBOX_SYNC_TAG,
  shouldBypass,
  staleCaches,
  SW_CACHE_NAME,
  SW_CACHE_PREFIX,
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
  });
});
