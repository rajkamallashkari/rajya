import { describe, expect, it } from "vitest";
import {
  isHttpGet,
  isImmutableAsset,
  isOwnCache,
  shouldBypass,
  staleCaches,
  SW_CACHE_NAME,
  SW_CACHE_PREFIX,
} from "./constants";

describe("pwa constants", () => {
  it("classifies requests and caches", () => {
    expect(isHttpGet("GET", "https:")).toBe(true);
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
