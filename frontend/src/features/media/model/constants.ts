import type { CSSProperties } from "react";
import registry from "@/shared/lib/config/settings-registry.json";
import type { components } from "@/shared/lib/api/schema";

export type Attachment = components["schemas"]["Attachment"];
export type GalleryAttachment = components["schemas"]["GalleryAttachment"];
export type GalleryLink = components["schemas"]["GalleryLink"];
export type GalleryItem = components["schemas"]["GalleryItem"];
export type GalleryKind = "images" | "files" | "links";
export type MediaVariant = "original" | "thumb";
export type ProcessingStatus = Attachment["processing_status"];
export type ProgressiveStage = "placeholder" | "thumb" | "full";
export type Corner = "tl" | "tr" | "bl" | "br";

export const ALBUM_GAP_PX = 2;
export const ALBUM_MAX_WIDTH_PX = 280;
export const ALBUM_CELL_HEIGHT_PX = 150;
export const ALBUM_SINGLE_MAX_HEIGHT_PX = 280;
export const ALBUM_VISIBLE_MAX = 4;
export const ALBUM_ASPECT_MIN = 0.5;
export const ALBUM_ASPECT_MAX = 2;
export const VIDEO_MAX_WIDTH_PX = 320;
export const VIDEO_DEFAULT_ASPECT = 16 / 9;
export const DEFAULT_MEDIA_WIDTH = 4;
export const DEFAULT_MEDIA_HEIGHT = 3;
export const BLURHASH_PIXELS = 32;
export const BYTE_UNITS = 1024;
export const FILENAME_TRUNCATE = 30;
export const VOICE_MIN_WIDTH_PX = 220;
export const VOICE_MAX_WIDTH_PX = 320;
export const VOICE_PLAYBACK_RATES = [1, 1.5, 2] as const;
export const MEDIA_URL_STALE_BUFFER_MS = 15_000;
export const MEDIA_URL_STALE_MAX_MS = 86_400_000;
export const LIGHTBOX_MAX_ZOOM = 3;
export const LIGHTBOX_ZOOM_STEP = 1;
export const GALLERY_FIRST_PAGE = 1;
export const GIF_SEARCH_MIN_QUERY_LENGTH = registry.gif_search_min_query_length.default as number;
export const FALLBACK_STICKER_TYPE = "image/png";
export const FALLBACK_STICKER_NAME = "sticker.png";

export const IMAGE_KINDS = new Set(["image"]);
export const ALBUM_KINDS = new Set(["image"]);
export const LIGHTBOX_KINDS = new Set(["image", "video"]);
export const FILE_KINDS = new Set(["file", "audio"]);

export function clampedAspect(width?: number | null, height?: number | null): number {
  const w = width && width > 0 ? width : DEFAULT_MEDIA_WIDTH;
  const h = height && height > 0 ? height : DEFAULT_MEDIA_HEIGHT;
  return Math.min(ALBUM_ASPECT_MAX, Math.max(ALBUM_ASPECT_MIN, w / h));
}

export function aspectStyle(width?: number | null, height?: number | null): CSSProperties {
  const w = width && width > 0 ? width : DEFAULT_MEDIA_WIDTH;
  const h = height && height > 0 ? height : DEFAULT_MEDIA_HEIGHT;
  return { aspectRatio: `${String(w)} / ${String(h)}` };
}

export function extraAlbumCount(total: number, visibleMax: number = ALBUM_VISIBLE_MAX): number {
  if (total <= visibleMax) {
    return 0;
  }
  return total - (visibleMax - 1);
}

export function isVisualAttachment(attachment: Pick<Attachment, "kind">): boolean {
  return LIGHTBOX_KINDS.has(attachment.kind);
}

export function isImageAttachment(attachment: Pick<Attachment, "kind">): boolean {
  return ALBUM_KINDS.has(attachment.kind);
}
