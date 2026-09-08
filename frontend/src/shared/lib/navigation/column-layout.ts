import {
  LAYER_DEFAULT_COLUMN_WIDTH_PX,
  LAYER_MIN_WIDTH_PX,
  LAYER_RESIZE_HANDLE_PX,
} from "@/shared/lib/navigation/constants";

export interface DesktopColumnWidths {
  list: number;
}

export function clampColumnWidth(next: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, next));
}

export function maxListWidthPx({
  handleWidth = LAYER_RESIZE_HANDLE_PX,
  hostWidth,
  minWidth = LAYER_MIN_WIDTH_PX,
}: {
  handleWidth?: number;
  hostWidth: number;
  minWidth?: number;
}): number {
  return Math.max(0, hostWidth - handleWidth - minWidth);
}

export function widthAfterResize({
  clientX,
  handleWidth = LAYER_RESIZE_HANDLE_PX,
  hostWidth,
  minWidth = LAYER_MIN_WIDTH_PX,
  originWidth,
  startX,
}: {
  clientX: number;
  handleWidth?: number;
  hostWidth: number;
  minWidth?: number;
  originWidth: number;
  startX: number;
}): number {
  return clampColumnWidth(
    originWidth + (clientX - startX),
    minWidth,
    maxListWidthPx({ handleWidth, hostWidth, minWidth }),
  );
}

export function fitDesktopColumns({
  handleWidth = LAYER_RESIZE_HANDLE_PX,
  hostWidth,
  listWidth,
  minWidth = LAYER_MIN_WIDTH_PX,
}: {
  handleWidth?: number;
  hostWidth: number;
  listWidth: number;
  minWidth?: number;
}): DesktopColumnWidths {
  if (hostWidth <= 0) {
    return { list: listWidth };
  }
  const available = Math.max(0, hostWidth - handleWidth);
  const maxList = Math.max(0, available - minWidth);
  return { list: clampColumnWidth(listWidth, minWidth, maxList) };
}

export function defaultDesktopColumns(): DesktopColumnWidths {
  return { list: LAYER_DEFAULT_COLUMN_WIDTH_PX };
}
