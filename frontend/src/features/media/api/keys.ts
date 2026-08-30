export const mediaKeys = {
  all: ["media"] as const,
  url: (id: number, variant: "original" | "thumb") => [...mediaKeys.all, "url", id, variant] as const,
  gallery: (conversationId: number, kind: string) =>
    [...mediaKeys.all, "gallery", conversationId, kind] as const,
  gifs: (query: string) => [...mediaKeys.all, "gifs", query] as const,
  stickerPacks: () => [...mediaKeys.all, "sticker_packs"] as const,
};
