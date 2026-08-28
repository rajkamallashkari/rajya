import { describe, expect, it } from "vitest";
import { clampMenuPosition, menuPosFromElement } from "./menu-position";

describe("clampMenuPosition", () => {
  it("keeps the menu on-screen", () => {
    expect(clampMenuPosition(10, 10, 40, 40, 400, 400)).toEqual({ left: 10, top: 10 });
    expect(clampMenuPosition(380, 380, 40, 40, 400, 400)).toEqual({ left: 340, top: 340 });
    expect(clampMenuPosition(0, 0, 500, 500, 200, 200, 4)).toEqual({ left: 4, top: 4 });
  });
});

describe("menuPosFromElement", () => {
  it("falls back when the node is missing and clamps when present", () => {
    expect(menuPosFromElement(null, 8, 9, 100, 100)).toEqual({ left: 8, top: 9 });
    const el = {
      getBoundingClientRect: () => ({ width: 50, height: 50 }) as DOMRect,
    };
    expect(menuPosFromElement(el, 90, 90, 100, 100)).toEqual({ left: 40, top: 40 });
  });
});
