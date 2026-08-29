import {
  LAYER_DEFAULT_COLUMN_WIDTH_PX,
  LAYER_MIN_WIDTH_PX,
  LAYER_RESIZE_HANDLE_PX,
} from "@/shared/lib/navigation/constants";

export type DesktopResizeEdge = "list" | "detail";

export interface DesktopColumnWidths {
  detail: number;
  list: number;
}

export function clampColumnWidth(next: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, next));
}

export function maxListWidthPx({
  detailOpen,
  detailWidth,
  handleWidth = LAYER_RESIZE_HANDLE_PX,
  hostWidth,
  minWidth = LAYER_MIN_WIDTH_PX,
}: {
  detailOpen: boolean;
  detailWidth: number;
  handleWidth?: number;
  hostWidth: number;
  minWidth?: number;
}): number {
  const handles = handleWidth * (detailOpen ? 2 : 1);
  const reserved = minWidth + handles + (detailOpen ? detailWidth : 0);
  return Math.max(minWidth, hostWidth - reserved);
}

export function maxDetailWidthPx({
  handleWidth = LAYER_RESIZE_HANDLE_PX,
  hostWidth,
  listWidth,
  minWidth = LAYER_MIN_WIDTH_PX,
}: {
  handleWidth?: number;
  hostWidth: number;
  listWidth: number;
  minWidth?: number;
}): number {
  const reserved = listWidth + minWidth + handleWidth * 2;
  return Math.max(minWidth, hostWidth - reserved);
}

export function widthAfterResize({
  clientX,
  detailOpen,
  detailWidth,
  edge,
  handleWidth = LAYER_RESIZE_HANDLE_PX,
  hostWidth,
  listWidth,
  minWidth = LAYER_MIN_WIDTH_PX,
  originWidth,
  startX,
}: {
  clientX: number;
  detailOpen: boolean;
  detailWidth: number;
  edge: DesktopResizeEdge;
  handleWidth?: number;
  hostWidth: number;
  listWidth: number;
  minWidth?: number;
  originWidth: number;
  startX: number;
}): number {
  if (edge === "list") {
    return clampColumnWidth(
      originWidth + (clientX - startX),
      minWidth,
      maxListWidthPx({ detailOpen, detailWidth, handleWidth, hostWidth, minWidth }),
    );
  }
  return clampColumnWidth(
    originWidth + (startX - clientX),
    minWidth,
    maxDetailWidthPx({ handleWidth, hostWidth, listWidth, minWidth }),
  );
}

export function fitDesktopColumns({
  detailOpen,
  detailWidth,
  handleWidth = LAYER_RESIZE_HANDLE_PX,
  hostWidth,
  listWidth,
  minWidth = LAYER_MIN_WIDTH_PX,
}: {
  detailOpen: boolean;
  detailWidth: number;
  handleWidth?: number;
  hostWidth: number;
  listWidth: number;
  minWidth?: number;
}): DesktopColumnWidths {
  if (hostWidth <= 0) {
    return { detail: detailWidth, list: listWidth };
  }
  const handles = handleWidth * (detailOpen ? 2 : 1);
  const available = Math.max(0, hostWidth - handles);
  if (!detailOpen) {
    const maxList = Math.max(minWidth, available - minWidth);
    return {
      detail: detailWidth,
      list: clampColumnWidth(listWidth, minWidth, maxList),
    };
  }
  const maxPinned = Math.max(0, available - minWidth);
  let list = listWidth;
  let detail = detailWidth;
  if (minWidth * 2 <= maxPinned) {
    list = Math.max(list, minWidth);
    detail = Math.max(detail, minWidth);
  }
  if (list + detail <= maxPinned) {
    return { detail, list };
  }
  const floor = Math.min(minWidth, maxPinned);
  detail = Math.max(floor, maxPinned - list);
  if (list + detail <= maxPinned) {
    return { detail, list };
  }
  list = Math.max(floor, maxPinned - detail);
  return { detail, list };
}

export function defaultDesktopColumns(): DesktopColumnWidths {
  return {
    detail: LAYER_DEFAULT_COLUMN_WIDTH_PX,
    list: LAYER_DEFAULT_COLUMN_WIDTH_PX,
  };
}
