import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { conversationKeys, messageKeys } from "@/features/conversations/api/keys";
import {
  addStickerToPack,
  createStickerPack,
  destroyStickerPack,
  getAttachmentDownload,
  getAttachmentThumbnail,
  listConversationMedia,
  listStickerPacks,
  removeStickerFromPack,
  retryAttachment,
  retryTranscript,
  searchGifs,
} from "@/features/media/api/http";
import { mediaKeys } from "@/features/media/api/keys";
import {
  GALLERY_FIRST_PAGE,
  GALLERY_PROCESSING_REFETCH_MS,
  GIF_SEARCH_MIN_QUERY_LENGTH,
  MEDIA_URL_STALE_BUFFER_MS,
  MEDIA_URL_STALE_MAX_MS,
  type GalleryKind,
} from "@/features/media/model/constants";
import type { components } from "@/shared/lib/api/schema";
import { showToast } from "@/shared/ui/toast";

type GalleryPage = components["schemas"]["GalleryPage"];
type MediaUrl = components["schemas"]["MediaUrl"];

export function mediaUrlStaleTime(expiresAt: string, now: number = Date.now()): number {
  const expires = Date.parse(expiresAt);
  if (!Number.isFinite(expires)) {
    return 0;
  }
  return Math.min(MEDIA_URL_STALE_MAX_MS, Math.max(0, expires - now - MEDIA_URL_STALE_BUFFER_MS));
}

export function useMediaUrl(id: number, variant: "original" | "thumb", enabled = true) {
  return useQuery({
    // Optimistic attachments carry a negative placeholder id until the server
    // row arrives; asking for a signed URL then only yields a 404.
    enabled: enabled && id > 0,
    queryFn: () => (variant === "thumb" ? getAttachmentThumbnail(id) : getAttachmentDownload(id)),
    queryKey: mediaKeys.url(id, variant),
    staleTime: (query) => mediaUrlStaleTime((query.state.data as MediaUrl | undefined)?.expires_at ?? ""),
  });
}

export function useConversationGallery(conversationId: number, kind: GalleryKind) {
  return useInfiniteQuery<
    GalleryPage,
    Error,
    InfiniteData<GalleryPage>,
    ReturnType<typeof mediaKeys.gallery>,
    number
  >({
    getNextPageParam: (lastPage) => (lastPage.meta.has_more ? lastPage.meta.page + 1 : undefined),
    initialPageParam: GALLERY_FIRST_PAGE,
    queryFn: ({ pageParam }) => listConversationMedia(conversationId, kind, pageParam),
    queryKey: mediaKeys.gallery(conversationId, kind),
    refetchInterval: (query) => {
      const data = query.state.data as InfiniteData<GalleryPage> | undefined;
      return data?.pages.some((page) =>
        page.items.some((item) => item.attachment?.processing_status === "pending"),
      )
        ? GALLERY_PROCESSING_REFETCH_MS
        : false;
    },
  });
}

export function useRetryAttachment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: retryAttachment,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

export function useRetryTranscript() {
  const client = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: retryTranscript,
    // Transcription needs a configured provider and a running worker; without
    // feedback a rejected request looks like a spinner that never resolves.
    onError: () => {
      showToast({ title: t("transcript.unavailable"), variant: "danger" });
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: mediaKeys.all });
      void client.invalidateQueries({ queryKey: messageKeys.all });
      void client.invalidateQueries({ queryKey: conversationKeys.all });
    },
  });
}

export function useStickerPacks() {
  return useQuery({
    queryFn: listStickerPacks,
    queryKey: mediaKeys.stickerPacks(),
  });
}

export function useCreateStickerPack() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createStickerPack,
    onSettled: () => {
      void client.invalidateQueries({ queryKey: mediaKeys.stickerPacks() });
    },
  });
}

export function useDestroyStickerPack() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: destroyStickerPack,
    onSettled: () => {
      void client.invalidateQueries({ queryKey: mediaKeys.stickerPacks() });
    },
  });
}

export function useAddStickerToPack() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      packId,
      signedId,
      shortcode,
    }: {
      packId: number;
      signedId: string;
      shortcode: string;
    }) => addStickerToPack(packId, { signed_id: signedId, shortcode }),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: mediaKeys.stickerPacks() });
    },
  });
}

export function useRemoveStickerFromPack() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ packId, id }: { packId: number; id: number }) =>
      removeStickerFromPack(packId, id),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: mediaKeys.stickerPacks() });
    },
  });
}

export function useGifSearch(query: string, enabled = true) {
  const q = query.trim();
  return useQuery({
    enabled: enabled && q.length >= GIF_SEARCH_MIN_QUERY_LENGTH,
    queryFn: () => searchGifs(q),
    queryKey: mediaKeys.gifs(q),
  });
}
