import { describe, expect, it } from "vitest";
import {
  clampColumnWidth,
  defaultDesktopColumns,
  fitDesktopColumns,
  maxListWidthPx,
  widthAfterResize,
} from "./column-layout";
import { LAYER_DEFAULT_COLUMN_WIDTH_PX, LAYER_MIN_WIDTH_PX } from "./constants";

describe("column-layout", () => {
  it("clamps the list against the chat minimum", () => {
    expect(clampColumnWidth(100, 280, 400)).toBe(280);
    expect(clampColumnWidth(500, 280, 400)).toBe(400);
    expect(clampColumnWidth(320, 280, 400)).toBe(320);
    expect(maxListWidthPx({ hostWidth: 1280 })).toBe(1280 - LAYER_MIN_WIDTH_PX - 4);
    expect(defaultDesktopColumns()).toEqual({ list: LAYER_DEFAULT_COLUMN_WIDTH_PX });
  });

  it("resizes the list edge without a detail column", () => {
    const shared = {
      hostWidth: 1280,
      originWidth: 360,
      startX: 200,
    };
    expect(widthAfterResize({ ...shared, clientX: 240 })).toBe(400);
    expect(widthAfterResize({ ...shared, clientX: 160 })).toBe(320);
    expect(
      widthAfterResize({
        ...shared,
        clientX: -2000,
        minWidth: LAYER_MIN_WIDTH_PX,
      }),
    ).toBe(LAYER_MIN_WIDTH_PX);
    expect(widthAfterResize({ ...shared, clientX: 8000 })).toBe(1280 - LAYER_MIN_WIDTH_PX - 4);
  });

  it("fits the list so the chat column keeps its minimum", () => {
    expect(fitDesktopColumns({ hostWidth: 0, listWidth: 360 })).toEqual({ list: 360 });
    expect(fitDesktopColumns({ hostWidth: 1280, listWidth: 2000 })).toEqual({
      list: 1280 - 4 - LAYER_MIN_WIDTH_PX,
    });
    expect(fitDesktopColumns({ hostWidth: 1280, listWidth: 100 })).toEqual({
      list: LAYER_MIN_WIDTH_PX,
    });
    expect(fitDesktopColumns({ hostWidth: 1280, listWidth: 360 })).toEqual({
      list: LAYER_DEFAULT_COLUMN_WIDTH_PX,
    });
    expect(fitDesktopColumns({ hostWidth: 400, listWidth: 360 })).toEqual({
      list: 400 - 4 - LAYER_MIN_WIDTH_PX,
    });
    expect(maxListWidthPx({ hostWidth: 400 })).toBe(400 - 4 - LAYER_MIN_WIDTH_PX);
  });
});
