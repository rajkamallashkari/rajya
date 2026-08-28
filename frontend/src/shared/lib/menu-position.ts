export const MENU_VIEWPORT_MARGIN_PX = 6;

export function clampMenuPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
  margin: number = MENU_VIEWPORT_MARGIN_PX,
): { left: number; top: number } {
  let left = x + width > viewportWidth ? x - width : x;
  let top = y + height > viewportHeight ? y - height : y;
  const maxLeft = Math.max(margin, viewportWidth - width - margin);
  const maxTop = Math.max(margin, viewportHeight - height - margin);
  left = Math.min(Math.max(left, margin), maxLeft);
  top = Math.min(Math.max(top, margin), maxTop);
  return { left, top };
}

export function menuPosFromElement(
  el: { getBoundingClientRect: () => DOMRect } | null,
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
): { left: number; top: number } {
  if (!el) {
    return { left: x, top: y };
  }
  const rect = el.getBoundingClientRect();
  return clampMenuPosition(x, y, rect.width, rect.height, viewportWidth, viewportHeight);
}
