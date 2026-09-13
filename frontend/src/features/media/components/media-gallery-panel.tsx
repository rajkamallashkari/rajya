import { useState } from "react";
import { RotateCw, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useConversationGallery, useRetryAttachment } from "@/features/media/api/queries";
import { MediaLightbox } from "@/features/media/components/media-lightbox";
import { RemoteProgressiveImage } from "@/features/media/components/remote-progressive-image";
import { DocumentBubble } from "@/features/media/components/document-bubble";
import { AttachmentStalled } from "@/features/media/components/attachment-stalled";
import type { GalleryAttachment, GalleryItem, GalleryKind } from "@/features/media/model/constants";
import { LayerHeader } from "@/app/navigation/layer-header";
import { useDateTimeFormatter } from "@/shared/hooks/use-date-time-formatter";
import { conversationLayer, useLayerStore } from "@/shared/lib/navigation/layer-store";
import {
  Button,
  EmptyState,
  ListView,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui";
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

function useGalleryJump(conversationId: number) {
  const openConversation = useLayerStore((state) => state.openConversation);
  const title = useLayerStore(
    (state) => state.layers.find((layer) => layer.kind === "conversation")?.title ?? "",
  );
  return (messageId: number) =>
    openConversation(conversationLayer(String(conversationId), title, String(messageId)));
}

function GalleryMeta({
  messageId,
  sender,
  sentAt,
  onJump,
}: {
  messageId: number;
  sender?: { display_name: string } | null;
  sentAt: string;
  onJump: (messageId: number) => void;
}) {
  const { t } = useTranslation();
  const formatDateTime = useDateTimeFormatter();
  return (
    <Button
      aria-label={t("media.jump_to_message")}
      className="h-auto min-h-[var(--touch-target-min)] w-full justify-start truncate px-0 text-[length:var(--text-xs)] text-[var(--text-secondary)]"
      onClick={(event) => {
        event.stopPropagation();
        onJump(messageId);
      }}
      type="button"
      variant="ghost"
    >
      <span className="truncate">
        {sender?.display_name ?? t("media.unknown_sender")} · {formatDateTime.dateTime(sentAt)}
      </span>
    </Button>
  );
}

function GalleryImages({ conversationId }: { conversationId: number }) {
  const { t } = useTranslation();
  const query = useConversationGallery(conversationId, "images");
  const attachments = flattenItems(query.data?.pages)
    .map((item) => item.attachment)
    .filter((row): row is GalleryAttachment => row != null);
  const slides = attachments.filter(
    (attachment) =>
      (attachment.kind === "image" && attachment.processing_status !== "failed") ||
      (attachment.kind === "video" && attachment.processing_status === "ready"),
  );
  const [open, setOpen] = useState<number | null>(null);
  const retry = useRetryAttachment();
  const jump = useGalleryJump(conversationId);
  return (
    <ListView
      onRetry={() => void query.refetch()}
      status={galleryStatus(query.isPending, query.isError)}
    >
      {attachments.length === 0 ? (
        <EmptyState
          description={t("media.gallery_empty_description")}
          title={t("media.gallery_empty")}
        />
      ) : (
        <div className="grid grid-cols-3 gap-[var(--space-1)]" data-gallery-images="">
          {attachments.map((attachment) =>
            attachment.processing_status !== "failed" ? (
              <div className="relative aspect-square min-w-0" key={attachment.id}>
                <Button
                  aria-label={attachment.filename ?? t("media.photo")}
                  className="relative h-full w-full min-w-0 overflow-hidden rounded-[var(--radius-md)] p-0"
                  disabled={attachment.kind === "video" && attachment.processing_status !== "ready"}
                  onClick={() => setOpen(slides.findIndex((item) => item.id === attachment.id))}
                  type="button"
                  variant="ghost"
                >
                  <RemoteProgressiveImage
                    alt={attachment.filename ?? t("media.photo")}
                    attachment={attachment}
                    className="h-full w-full min-w-0"
                    wantFull={false}
                  />
                  {attachment.kind === "video" ? (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      {attachment.processing_status === "ready" ? (
                        <Video className={ICON_CLASS} />
                      ) : (
                        <span className="text-[length:var(--text-xs)]">{t("media.processing")}</span>
                      )}
                    </span>
                  ) : null}
                </Button>
                {attachment.processing_stalled && attachment.original_available ? (
                  <div className="absolute inset-x-1 bottom-1 rounded bg-[var(--surface-panel)] px-[var(--space-1)]">
                    <AttachmentStalled onRetry={() => retry.mutate(attachment.id)} />
                  </div>
                ) : null}
              </div>
            ) : (
              <div
                className="flex aspect-square items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-input)] p-[var(--space-2)] text-center text-[length:var(--text-xs)] text-[var(--text-secondary)]"
                key={attachment.id}
              >
                <Button
                  aria-label={t("media.retry")}
                  onClick={() => retry.mutate(attachment.id)}
                  type="button"
                  variant="ghost"
                >
                  <RotateCw className={ICON_CLASS} />
                  {attachment.processing_error ?? t("media.failed")}
                </Button>
              </div>
            ),
          )}
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
        attachments={slides}
        initialIndex={open ?? 0}
        onClose={() => setOpen(null)}
        onJump={jump}
        open={open != null}
      />
    </ListView>
  );
}

function GalleryFiles({ conversationId }: { conversationId: number }) {
  const { t } = useTranslation();
  const query = useConversationGallery(conversationId, "files");
  const retry = useRetryAttachment();
  const attachments = flattenItems(query.data?.pages)
    .map((item) => item.attachment)
    .filter((row): row is GalleryAttachment => row != null);
  const jump = useGalleryJump(conversationId);
  return (
    <ListView
      onRetry={() => void query.refetch()}
      status={galleryStatus(query.isPending, query.isError)}
    >
      {attachments.length === 0 ? (
        <EmptyState
          description={t("media.gallery_empty_description")}
          title={t("media.gallery_empty")}
        />
      ) : (
        <div className="flex flex-col gap-[var(--space-2)]" data-gallery-files="">
          {attachments.map((attachment) => (
            <div className="flex flex-col gap-[var(--space-1)]" key={attachment.id}>
              <DocumentBubble attachment={attachment} />
              {attachment.processing_stalled && attachment.original_available ? (
                <AttachmentStalled onRetry={() => retry.mutate(attachment.id)} />
              ) : null}
              <GalleryMeta
                messageId={attachment.message_id}
                onJump={jump}
                sender={attachment.sender}
                sentAt={attachment.sent_at}
              />
            </div>
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
  const jump = useGalleryJump(conversationId);
  return (
    <ListView
      onRetry={() => void query.refetch()}
      status={galleryStatus(query.isPending, query.isError)}
    >
      {links.length === 0 ? (
        <EmptyState
          description={t("media.gallery_empty_description")}
          title={t("media.gallery_empty")}
        />
      ) : (
        <div className="flex flex-col" data-gallery-links="">
          {links.map((link) => (
            <div
              className="flex items-start gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] text-[var(--text-primary)] no-underline hover:bg-[var(--surface-hover)]"
              key={`${String(link.message_id)}:${link.url}`}
            >
              <span className="min-w-0 flex-1">
                {link.site_name ? (
                  <span className="block text-[length:var(--text-xs)] text-[var(--text-tertiary)]">
                    {link.site_name}
                  </span>
                ) : null}
                <a
                  className="block text-[length:var(--text-sm)] text-[var(--text-primary)]"
                  href={link.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {link.title ?? link.url}
                </a>
                {link.description ? (
                  <span className="mt-[var(--space-0_5)] block text-[length:var(--text-xs)] text-[var(--text-secondary)]">
                    {link.description}
                  </span>
                ) : null}
                <GalleryMeta
                  messageId={link.message_id}
                  onJump={jump}
                  sender={link.sender}
                  sentAt={link.sent_at}
                />
              </span>
            </div>
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
            <EmptyState
              description={t("media.gallery_empty_description")}
              title={t("media.gallery_empty")}
            />
          )}
        </div>
      </Tabs>
    </div>
  );
}
