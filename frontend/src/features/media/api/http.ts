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

export async function createDirectUpload(body: {
  filename: string;
  byte_size: number;
  checksum: string;
  content_type: string;
}) {
  return unwrap(
    await apiClient().POST("/api/v1/direct_uploads", {
      headers: bearerHeaders(),
      body,
    }),
    "direct_upload_failed",
  );
}

export async function createStickerPack(body: {
  name: string;
  kind?: "sticker" | "emoji";
  slug?: string;
  position?: number;
}) {
  return unwrap(
    await apiClient().POST("/api/v1/sticker_packs", {
      headers: bearerHeaders(),
      body,
    }),
    "sticker_pack_create_failed",
  );
}

export async function destroyStickerPack(id: number) {
  return unwrap(
    await apiClient().DELETE("/api/v1/sticker_packs/{id}", {
      headers: bearerHeaders(),
      params: { path: { id } },
    }),
    "sticker_pack_destroy_failed",
  );
}

export async function addStickerToPack(
  packId: number,
  body: { signed_id: string; shortcode: string; position?: number },
) {
  return unwrap(
    await apiClient().POST("/api/v1/sticker_packs/{sticker_pack_id}/stickers", {
      headers: bearerHeaders(),
      params: { path: { sticker_pack_id: packId } },
      body,
    }),
    "sticker_add_failed",
  );
}

export async function removeStickerFromPack(packId: number, id: number) {
  return unwrap(
    await apiClient().DELETE("/api/v1/sticker_packs/{sticker_pack_id}/stickers/{id}", {
      headers: bearerHeaders(),
      params: { path: { sticker_pack_id: packId, id } },
    }),
    "sticker_remove_failed",
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
