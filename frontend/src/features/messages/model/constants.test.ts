import { describe, expect, it } from "vitest";
import { PLAIN_HIGHLIGHT_LANG, resolveHighlightLang } from "./constants";

describe("resolveHighlightLang", () => {
  it("resolves aliases, known langs, and unknown langs", () => {
    expect(resolveHighlightLang("")).toBe(PLAIN_HIGHLIGHT_LANG);
    expect(resolveHighlightLang("  ")).toBe(PLAIN_HIGHLIGHT_LANG);
    expect(resolveHighlightLang("javascript")).toBe("javascript");
    expect(resolveHighlightLang("ruby")).toBe("ruby");
    expect(resolveHighlightLang("ts")).toBe("typescript");
    expect(resolveHighlightLang("py")).toBe("python");
    expect(resolveHighlightLang("rb")).toBe("ruby");
    expect(resolveHighlightLang("sh")).toBe("bash");
    expect(resolveHighlightLang("brainfuck")).toBe(PLAIN_HIGHLIGHT_LANG);
  });
});
