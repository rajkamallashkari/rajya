import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useConversationGallery } from "@/features/media/api/queries";
import { MediaLightbox } from "@/features/media/components/media-lightbox";
import { RemoteProgressiveImage } from "@/features/media/components/remote-progressive-image";
import { DocumentBubble } from "@/features/media/components/document-bubble";
import type { GalleryAttachment, GalleryItem, GalleryKind } from "@/features/media/model/constants";
import { LayerHeader } from "@/app/navigation/layer-header";
import { Button, EmptyState, ListView, Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui";
import { ICON_CLASS } from "@/shared/ui/metrics";

const TABS: GalleryKind[] = ["images", "files", "links"];

function galleryStatus(isPending: boolean, isError: boolean): "loading" | "error" | "ready" {
  if (isPending) {
    return "loading";
  }
  if (isError) {
    return "error";
  }
  return "ready";
}

function flattenItems(pages: { items: GalleryItem[] }[] | undefined): GalleryItem[] {
  const items: GalleryItem[] = [];
  for (const page of pages ?? []) {
    items.push(...page.items);
  }
  return items;
}

function GalleryImages({ conversationId }: { conversationId: number }) {
  const { t } = useTranslation();
  const query = useConversationGallery(conversationId, "images");
  const attachments = flattenItems(query.data?.pages)
    .map((item) => item.attachment)
    .filter((row): row is GalleryAttachment => row != null);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <ListView onRetry={() => void query.refetch()} status={galleryStatus(query.isPending, query.isError)}>
      {attachments.length === 0 ? (
        <EmptyState description={t("media.gallery_empty_description")} title={t("media.gallery_empty")} />
      ) : (
        <div className="grid grid-cols-3 gap-[var(--space-1)]" data-gallery-images="">
          {attachments.map((attachment, index) => (
            <Button
              aria-label={attachment.filename ?? t("media.photo")}
              className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] p-0"
              key={attachment.id}
              onClick={() => setOpen(index)}
              type="button"
              variant="ghost"
            >
              <RemoteProgressiveImage
                alt={attachment.filename ?? t("media.photo")}
                attachment={attachment}
                wantFull={false}
              />
            </Button>
          ))}
        </div>
      )}
      {query.hasNextPage ? (
        <Button
          className="mt-[var(--space-3)]"
          onClick={() => void query.fetchNextPage()}
          type="button"
          variant="secondary"
        >
          {t("media.load_more")}
        </Button>
      ) : null}
      <MediaLightbox
        attachments={attachments}
        initialIndex={open ?? 0}
        onClose={() => setOpen(null)}
        open={open != null}
      />
    </ListView>
  );
}

function GalleryFiles({ conversationId }: { conversationId: number }) {
  const { t } = useTranslation();
  const query = useConversationGallery(conversationId, "files");
  const attachments = flattenItems(query.data?.pages)
    .map((item) => item.attachment)
    .filter((row): row is GalleryAttachment => row != null);
  return (
    <ListView onRetry={() => void query.refetch()} status={galleryStatus(query.isPending, query.isError)}>
      {attachments.length === 0 ? (
        <EmptyState description={t("media.gallery_empty_description")} title={t("media.gallery_empty")} />
      ) : (
        <div className="flex flex-col gap-[var(--space-2)]" data-gallery-files="">
          {attachments.map((attachment) => (
            <DocumentBubble attachment={attachment} key={attachment.id} />
          ))}
        </div>
      )}
    </ListView>
  );
}

function GalleryLinks({ conversationId }: { conversationId: number }) {
  const { t } = useTranslation();
  const query = useConversationGallery(conversationId, "links");
  const links = flattenItems(query.data?.pages)
    .map((item) => item.link)
    .filter((row): row is NonNullable<typeof row> => row != null);
  return (
    <ListView onRetry={() => void query.refetch()} status={galleryStatus(query.isPending, query.isError)}>
      {links.length === 0 ? (
        <EmptyState description={t("media.gallery_empty_description")} title={t("media.gallery_empty")} />
      ) : (
        <div className="flex flex-col" data-gallery-links="">
          {links.map((link) => (
            <a
              className="flex items-start gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] text-[var(--text-primary)] no-underline hover:bg-[var(--surface-hover)]"
              href={link.url}
              key={link.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ExternalLink className={ICON_CLASS} />
              <span className="min-w-0 flex-1">
                {link.site_name ? (
                  <span className="block text-[length:var(--text-xs)] text-[var(--text-tertiary)]">
                    {link.site_name}
                  </span>
                ) : null}
                <span className="block text-[length:var(--text-sm)]">{link.title ?? link.url}</span>
                {link.description ? (
                  <span className="mt-[var(--space-0_5)] block text-[length:var(--text-xs)] text-[var(--text-secondary)]">
                    {link.description}
                  </span>
                ) : null}
              </span>
            </a>
          ))}
        </div>
      )}
    </ListView>
  );
}

export function MediaGalleryPanel({ conversationId }: { conversationId: string }) {
  const { t } = useTranslation();
  const numericId = Number(conversationId);
  const live = Number.isFinite(numericId) && numericId > 0;
  const [tab, setTab] = useState<GalleryKind>("images");

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]" data-media-gallery="">
      <LayerHeader title={t("media.gallery_title")} />
      <Tabs
        className="flex min-h-0 flex-1 flex-col"
        onValueChange={(value) => setTab(value as GalleryKind)}
        value={tab}
      >
        <TabsList className="mx-[var(--space-list-x)] mt-[var(--space-2)]">
          {TABS.map((kind) => (
            <TabsTrigger key={kind} value={kind}>
              {t(`media.tabs.${kind}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="min-h-0 flex-1 overflow-y-auto px-[var(--space-list-x)] py-[var(--space-3)]">
          {live ? (
            <>
              <TabsContent value="images">
                <GalleryImages conversationId={numericId} />
              </TabsContent>
              <TabsContent value="files">
                <GalleryFiles conversationId={numericId} />
              </TabsContent>
              <TabsContent value="links">
                <GalleryLinks conversationId={numericId} />
              </TabsContent>
            </>
          ) : (
            <EmptyState description={t("media.gallery_empty_description")} title={t("media.gallery_empty")} />
          )}
        </div>
      </Tabs>
    </div>
  );
}
