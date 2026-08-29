import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  applySkinTone,
  DEFAULT_EMOJI,
  filterGifs,
  filterReplies,
  rememberEmoji,
  type GifView,
  type PickerTab,
  type SavedReplyView,
  type StickerView,
} from "@/features/composer/model/picker";
import { Button, EmptyState } from "@/shared/ui";
import { BottomSheet, BottomSheetContent, BottomSheetTitle } from "@/shared/ui/bottom-sheet";
import { Input } from "@/shared/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

export function PickerSheet({
  gifs,
  onOpenChange,
  onPickEmoji,
  onPickGif,
  onPickReply,
  onPickSticker,
  open,
  replies,
  stickers,
}: {
  gifs: GifView[];
  onOpenChange: (open: boolean) => void;
  onPickEmoji: (emoji: string) => void;
  onPickGif: (gif: GifView) => void;
  onPickReply: (reply: SavedReplyView) => void;
  onPickSticker: (sticker: StickerView) => void;
  open: boolean;
  replies: SavedReplyView[];
  stickers: StickerView[];
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<PickerTab>("emoji");
  const [recent, setRecent] = useState<string[]>([]);
  const [gifQuery, setGifQuery] = useState("");
  const [replyQuery, setReplyQuery] = useState("");
  const tone = Number.parseInt(document.documentElement.dataset.skinTone ?? "0", 10) || 0;
  const gifHits = useMemo(() => filterGifs(gifs, gifQuery), [gifs, gifQuery]);
  const replyHits = useMemo(() => filterReplies(replies, replyQuery), [replies, replyQuery]);

  function pickEmoji(emoji: string): void {
    const next = applySkinTone(emoji, tone);
    setRecent((current) => rememberEmoji(current, next));
    onPickEmoji(next);
  }

  return (
    <BottomSheet onOpenChange={onOpenChange} open={open}>
      <BottomSheetContent>
        <BottomSheetTitle>{t("picker.title")}</BottomSheetTitle>
        <Tabs onValueChange={(value) => setTab(value as PickerTab)} value={tab}>
          <TabsList>
            <TabsTrigger value="emoji">{t("picker.emoji")}</TabsTrigger>
            <TabsTrigger value="stickers">{t("picker.stickers")}</TabsTrigger>
            <TabsTrigger value="gifs">{t("picker.gifs")}</TabsTrigger>
            <TabsTrigger value="replies">{t("picker.replies")}</TabsTrigger>
          </TabsList>
          <TabsContent value="emoji">
            {recent.length > 0 ? (
              <div className="mb-[var(--space-3)]">
                <p className="mb-[var(--space-1)] text-[var(--text-tertiary)]">
                  {t("picker.recent")}
                </p>
                <EmojiGrid emoji={recent} onPick={pickEmoji} />
              </div>
            ) : null}
            <EmojiGrid emoji={[...DEFAULT_EMOJI]} onPick={pickEmoji} />
          </TabsContent>
          <TabsContent value="stickers">
            {stickers.length === 0 ? (
              <EmptyState title={t("picker.empty_stickers")} />
            ) : (
              <div className="grid grid-cols-4 gap-[var(--space-2)]">
                {stickers.map((sticker) => (
                  <Button
                    className="bg-[var(--surface-hover)]"
                    key={sticker.id}
                    onClick={() => onPickSticker(sticker)}
                    type="button"
                    variant="ghost"
                  >
                    {sticker.shortcode}
                  </Button>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="gifs">
            <Input
              onChange={(event) => setGifQuery(event.target.value)}
              placeholder={t("picker.search_gifs")}
              value={gifQuery}
            />
            {gifHits.length === 0 ? (
              <EmptyState title={t("picker.empty_gifs")} />
            ) : (
              <ul className="mt-[var(--space-2)] grid grid-cols-2 gap-[var(--space-2)]">
                {gifHits.map((gif) => (
                  <li key={gif.id}>
                    <Button
                      className="min-h-[var(--space-16)] w-full bg-[var(--surface-hover)]"
                      onClick={() => onPickGif(gif)}
                      type="button"
                      variant="ghost"
                    >
                      {gif.previewLabel}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-[var(--space-2)] text-[var(--text-tertiary)]">
              {t("picker.gif_attribution")}
            </p>
          </TabsContent>
          <TabsContent value="replies">
            <Input
              onChange={(event) => setReplyQuery(event.target.value)}
              placeholder={t("picker.search_replies")}
              value={replyQuery}
            />
            {replyHits.length === 0 ? (
              <EmptyState title={t("picker.empty_replies")} />
            ) : (
              <ul className="mt-[var(--space-2)] flex flex-col">
                {replyHits.map((reply) => (
                  <li key={reply.id}>
                    <Button
                      className="h-auto w-full flex-col items-start px-[var(--space-2)] py-[var(--space-1)] text-left"
                      onClick={() => onPickReply(reply)}
                      type="button"
                      variant="ghost"
                    >
                      <span className="text-[var(--accent)]">{reply.shortcut}</span>
                      <span className="text-[var(--text-secondary)]">{reply.body}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </BottomSheetContent>
    </BottomSheet>
  );
}

function EmojiGrid({ emoji, onPick }: { emoji: string[]; onPick: (emoji: string) => void }) {
  return (
    <div className="grid grid-cols-8 gap-[var(--space-1)]">
      {emoji.map((item) => (
        <Button key={item} onClick={() => onPick(item)} size="icon" type="button" variant="ghost">
          {item}
        </Button>
      ))}
    </div>
  );
}
