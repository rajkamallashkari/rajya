import { beforeEach, describe, expect, it, vi } from "vitest";

const { createHighlighter, createCssVariablesTheme } = vi.hoisted(() => ({
  createCssVariablesTheme: vi.fn(() => ({ name: "rajya" })),
  createHighlighter: vi.fn(),
}));

vi.mock("shiki", () => ({ createHighlighter }));
vi.mock("shiki/core", () => ({ createCssVariablesTheme }));

import { highlightCode, resetMessageHighlighter } from "./highlight";

describe("highlightCode", () => {
  beforeEach(() => {
    resetMessageHighlighter();
    createHighlighter.mockReset();
    createCssVariablesTheme.mockClear();
  });

  it("highlights with a loaded language and falls back to plaintext", async () => {
    const codeToHtml = vi.fn().mockResolvedValue("<pre>ok</pre>");
    createHighlighter.mockResolvedValue({
      codeToHtml,
      getLoadedLanguages: () => ["javascript"],
    });
    await expect(highlightCode("const x = 1", "js")).resolves.toBe("<pre>ok</pre>");
    expect(codeToHtml).toHaveBeenCalledWith("const x = 1", { lang: "javascript", theme: "rajya" });
    await expect(highlightCode("x", "unknown")).resolves.toBe("<pre>ok</pre>");
    expect(codeToHtml).toHaveBeenLastCalledWith("x", { lang: "text", theme: "rajya" });
  });

  it("returns null when highlighting fails", async () => {
    createHighlighter.mockRejectedValue(new Error("wasm"));
    await expect(highlightCode("x", "js")).resolves.toBeNull();
  });

  it("accepts an injected factory", async () => {
    const factory = vi.fn().mockRejectedValue(new Error("nope"));
    await expect(highlightCode("x", "js", factory)).resolves.toBeNull();
    expect(factory).toHaveBeenCalled();
  });
});
