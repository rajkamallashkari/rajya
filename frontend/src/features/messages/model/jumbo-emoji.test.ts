import { describe, expect, it } from "vitest";
import { getJumboInfo, jumboSizeToken } from "./jumbo-emoji";

describe("getJumboInfo", () => {
  it("accepts one to three emoji graphemes and rejects mixed text", () => {
    expect(getJumboInfo("🎉")).toBe(1);
    expect(getJumboInfo("🎉🎉")).toBe(2);
    expect(getJumboInfo("🎉🎉🎉")).toBe(3);
    expect(getJumboInfo("🎉🎉🎉🎉")).toBeNull();
    expect(getJumboInfo("hello")).toBeNull();
    expect(getJumboInfo("🎉 hi")).toBeNull();
    expect(getJumboInfo("")).toBeNull();
    expect(getJumboInfo("   ")).toBeNull();
    expect(getJumboInfo(null)).toBeNull();
    expect(getJumboInfo("👍🏽")).toBe(1);
    expect(jumboSizeToken(1)).toBe("var(--text-jumbo-1)");
    expect(jumboSizeToken(2)).toBe("var(--text-jumbo-2)");
    expect(jumboSizeToken(3)).toBe("var(--text-jumbo-3)");
  });

  it("falls back when Intl.Segmenter is missing", () => {
    const intl = globalThis.Intl;
    const original = intl.Segmenter;
    Object.defineProperty(intl, "Segmenter", { configurable: true, value: undefined });
    try {
      expect(getJumboInfo("🎉")).toBe(1);
      expect(getJumboInfo("abc")).toBeNull();
      expect(getJumboInfo("\uFE0F")).toBeNull();
    } finally {
      Object.defineProperty(intl, "Segmenter", { configurable: true, value: original });
    }
  });
});
