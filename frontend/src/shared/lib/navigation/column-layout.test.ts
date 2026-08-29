import { describe, expect, it } from "vitest";
import {
  clampColumnWidth,
  defaultDesktopColumns,
  fitDesktopColumns,
  maxDetailWidthPx,
  maxListWidthPx,
  widthAfterResize,
} from "./column-layout";
import { LAYER_DEFAULT_COLUMN_WIDTH_PX, LAYER_MIN_WIDTH_PX } from "./constants";

describe("column-layout", () => {
  it("clamps and reports independent list and detail maxima", () => {
    expect(clampColumnWidth(100, 280, 400)).toBe(280);
    expect(clampColumnWidth(500, 280, 400)).toBe(400);
    expect(clampColumnWidth(320, 280, 400)).toBe(320);
    expect(maxListWidthPx({ detailOpen: false, detailWidth: 360, hostWidth: 1280 })).toBe(
      1280 - LAYER_MIN_WIDTH_PX - 4,
    );
    expect(
      maxListWidthPx({ detailOpen: true, detailWidth: 360, hostWidth: 1280, handleWidth: 4 }),
    ).toBe(1280 - LAYER_MIN_WIDTH_PX - 360 - 8);
    expect(maxDetailWidthPx({ hostWidth: 1280, listWidth: 360 })).toBe(
      1280 - 360 - LAYER_MIN_WIDTH_PX - 8,
    );
    expect(defaultDesktopColumns()).toEqual({
      detail: LAYER_DEFAULT_COLUMN_WIDTH_PX,
      list: LAYER_DEFAULT_COLUMN_WIDTH_PX,
    });
  });

  it("resizes the dragged edge without using the other edge's delta", () => {
    const shared = {
      detailOpen: true,
      detailWidth: 360,
      hostWidth: 1280,
      listWidth: 360,
      originWidth: 360,
      startX: 200,
    };
    expect(widthAfterResize({ ...shared, clientX: 240, edge: "list" })).toBe(400);
    expect(widthAfterResize({ ...shared, clientX: 240, detailOpen: false, edge: "list" })).toBe(
      400,
    );
    expect(widthAfterResize({ ...shared, clientX: 160, edge: "list" })).toBe(320);
    expect(widthAfterResize({ ...shared, clientX: 160, edge: "detail" })).toBe(400);
    expect(widthAfterResize({ ...shared, clientX: 240, edge: "detail" })).toBe(320);
    expect(
      widthAfterResize({
        ...shared,
        clientX: -2000,
        edge: "list",
        minWidth: LAYER_MIN_WIDTH_PX,
      }),
    ).toBe(LAYER_MIN_WIDTH_PX);
    expect(
      widthAfterResize({
        ...shared,
        clientX: 8000,
        edge: "list",
      }),
    ).toBe(1280 - LAYER_MIN_WIDTH_PX - 360 - 8);
    expect(
      widthAfterResize({
        ...shared,
        clientX: 8000,
        edge: "detail",
        originWidth: 360,
      }),
    ).toBe(LAYER_MIN_WIDTH_PX);
  });

  it("fits pinned columns so the conversation keeps its minimum", () => {
    expect(
      fitDesktopColumns({
        detailOpen: false,
        detailWidth: 360,
        hostWidth: 0,
        listWidth: 360,
      }),
    ).toEqual({ detail: 360, list: 360 });
    expect(
      fitDesktopColumns({
        detailOpen: false,
        detailWidth: 900,
        hostWidth: 1280,
        listWidth: 2000,
      }),
    ).toEqual({ detail: 900, list: 1280 - 4 - LAYER_MIN_WIDTH_PX });
    expect(
      fitDesktopColumns({
        detailOpen: false,
        detailWidth: 360,
        hostWidth: 1280,
        listWidth: 100,
      }),
    ).toEqual({ detail: 360, list: LAYER_MIN_WIDTH_PX });
    expect(
      fitDesktopColumns({
        detailOpen: true,
        detailWidth: 360,
        hostWidth: 1280,
        listWidth: 360,
      }),
    ).toEqual({ detail: 360, list: 360 });
    expect(
      fitDesktopColumns({
        detailOpen: true,
        detailWidth: 500,
        hostWidth: 1000,
        listWidth: 500,
      }),
    ).toEqual({
      detail: LAYER_MIN_WIDTH_PX,
      list: 1000 - 8 - LAYER_MIN_WIDTH_PX - LAYER_MIN_WIDTH_PX,
    });
    expect(
      fitDesktopColumns({
        detailOpen: true,
        detailWidth: 700,
        hostWidth: 1000,
        listWidth: 200,
        minWidth: 280,
      }),
    ).toEqual({ detail: 1000 - 8 - 280 - 280, list: 280 });
    expect(
      fitDesktopColumns({
        detailOpen: true,
        detailWidth: 360,
        hostWidth: 400,
        listWidth: 360,
      }),
    ).toEqual({
      detail: 400 - 8 - LAYER_MIN_WIDTH_PX,
      list: 400 - 8 - LAYER_MIN_WIDTH_PX,
    });
  });
});
