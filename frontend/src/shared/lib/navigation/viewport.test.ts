import { describe, expect, it, vi } from "vitest";
import { MOBILE_MAX_PX } from "./constants";
import { isMobileViewport, subscribeViewport } from "./viewport";

describe("viewport", () => {
  it("treats a narrow window as mobile and unsubscribes listeners", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 390 });
    const originalMatch = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("max-width") || query.includes("coarse"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })) as typeof window.matchMedia;
    expect(isMobileViewport()).toBe(true);
    const onChange = vi.fn();
    const unsubscribe = subscribeViewport(onChange);
    unsubscribe();
    window.matchMedia = originalMatch;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: MOBILE_MAX_PX + 100,
    });
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })) as typeof window.matchMedia;
    expect(isMobileViewport()).toBe(false);
    window.matchMedia = originalMatch;
  });
});
