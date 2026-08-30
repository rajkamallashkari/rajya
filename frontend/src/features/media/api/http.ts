import { apiClient, bearerHeaders, unwrap } from "@/features/auth/api/http";
import type { components } from "@/shared/lib/api/schema";
import type { GalleryKind } from "@/features/media/model/constants";

export type MediaUrl = components["schemas"]["MediaUrl"];

export async function getAttachmentDownload(id: number) {
  return unwrap(
    await apiClient().GET("/api/v1/attachments/{id}/download", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "media_url_failed",
  );
}

export async function getAttachmentThumbnail(id: number) {
  return unwrap(
    await apiClient().GET("/api/v1/attachments/{id}/thumbnail", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "media_thumb_failed",
  );
}

export async function retryAttachment(id: number) {
  return unwrap(
    await apiClient().POST("/api/v1/attachments/{id}/retry", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "media_retry_failed",
  );
}

export async function retryTranscript(id: number) {
  return unwrap(
    await apiClient().POST("/api/v1/attachments/{id}/transcribe", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "transcript_retry_failed",
  );
}

export async function listConversationMedia(
  conversationId: number,
  kind: GalleryKind,
  page?: number,
) {
  return unwrap(
    await apiClient().GET("/api/v1/conversations/{id}/media", {
      headers: bearerHeaders(),
      params: { path: { id: conversationId }, query: { kind, page } },
    }),
    "gallery_failed",
  );
}

export async function listStickerPacks() {
  return unwrap(
    await apiClient().GET("/api/v1/sticker_packs", { headers: bearerHeaders() }),
    "sticker_packs_failed",
  );
}

export async function searchGifs(q: string) {
  return unwrap(
    await apiClient().GET("/api/v1/gifs", {
      headers: bearerHeaders(),
      params: { query: { q } },
    }),
    "gif_search_failed",
  );
}
