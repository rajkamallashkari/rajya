import { LIGHTBOX_MAX_ZOOM, LIGHTBOX_ZOOM_STEP } from "@/features/media/model/constants";

export function nextLightboxZoom(current: number): number {
  if (current >= LIGHTBOX_MAX_ZOOM) {
    return 1;
  }
  return Math.min(LIGHTBOX_MAX_ZOOM, current + LIGHTBOX_ZOOM_STEP);
}

export function wrapLightboxIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return ((index % length) + length) % length;
}
