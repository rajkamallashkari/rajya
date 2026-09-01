import { Calendar, Mic, Paperclip, Send, Sparkles } from "lucide-react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useTranslation } from "react-i18next";
import {
  ComposerAttachmentChips,
  ComposerScheduleBar,
  type ComposerAttachment,
} from "@/features/composer/components/composer-extras";
import { ComposerStrip, type ComposerReply } from "@/features/composer/components/composer-strip";
import { SlashCommandMenu } from "@/features/composer/components/slash-command-menu";
import { VoiceRecorder } from "@/features/composer/components/voice-recorder";
import {
  useVoiceRecorder,
  type VoiceRecorderResult,
} from "@/features/composer/hooks/use-voice-recorder";
import {
  expandSavedReplyShortcut,
  filterCommands,
  isPickerCommand,
  pickerTabForSlash,
  savedRepliesAsCommands,
  slashMenuOpen,
  type GifView,
  type PickerTab,
  type SavedReplyView,
  type SlashCommand,
  type StickerView,
} from "@/features/composer/model/picker";
import { selectVoicePeaks } from "@/features/composer/model/waveform";
import { usePressHold } from "@/shared/hooks/use-press-hold";
import { loadPickerSheet } from "@/shared/lib/chunks";
import { SHORTCUTS } from "@/shared/lib/shortcuts/constants";
import { cn } from "@/shared/lib/cn";
import { Button, DismissLayer, IconButton, Textarea } from "@/shared/ui";
import {
  ICON_CLASS,
  MENU_CONTENT_CLASS,
  MENU_ITEM_AI_CLASS,
  MENU_ITEM_CLASS,
} from "@/shared/ui/metrics";

export type { ComposerAttachment };

const PickerSheet = lazy(() => loadPickerSheet().then((mod) => ({ default: mod.PickerSheet })));

export interface ComposerSendPayload {
  silent: boolean;
  text: string;
}

export interface ComposerVoicePayload {
  blob: Blob;
  durationMs: number;
  mimeType: string;
  peaks: number[];
}

export function Composer({
  attachments = [],
  defaultValue = "",
  editing = false,
  gifUnavailable = false,
  gifs = [],
  onAttach,
  onChange,
  onDismissEdit,
  onDismissReply,
  onEditLast,
  onGifQueryChange,
  onPickGif,
  onPickSticker,
  onRemoveAttachment,
  onRewrite,
  onSchedule,
  onClearSchedule,
  onOpenSchedule,
  onSend,
  onVoiceSend,
  placeholder,
  provisional = false,
  remoteGifs = false,
  replyTo,
  savedReplies = [],
  scheduledLabel,
  slashCommands = [],
  stickers = [],
  value,
  voice,
}: {
  attachments?: ComposerAttachment[];
  defaultValue?: string;
  editing?: boolean;
  gifUnavailable?: boolean;
  gifs?: GifView[];
  onAttach?: () => void;
  onChange?: (value: string) => void;
  onClearSchedule?: () => void;
  onDismissEdit?: () => void;
  onDismissReply?: () => void;
  onEditLast?: () => void;
  onGifQueryChange?: (query: string) => void;
  onOpenSchedule?: () => void;
  onPickGif?: (gif: GifView) => void;
  onPickSticker?: (sticker: StickerView) => void;
  onRemoveAttachment?: (id: string) => void;
  onRewrite?: () => void;
  onSchedule?: () => void;
  onSend: (payload: ComposerSendPayload) => void;
  onVoiceSend?: (payload: ComposerVoicePayload) => void;
  placeholder?: string;
  provisional?: boolean;
  remoteGifs?: boolean;
  replyTo?: ComposerReply | null;
  savedReplies?: SavedReplyView[];
  scheduledLabel?: string | null;
  slashCommands?: SlashCommand[];
  stickers?: StickerView[];
  value?: string;
  voice?: VoiceRecorderResult;
}) {
  const { t } = useTranslation();
  const hooked = useVoiceRecorder();
  const recorder = voice ?? hooked;
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const [sendMenuOpen, setSendMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<PickerTab>("emoji");
  const pendingVoiceSend = useRef(false);
  const controlled = value !== undefined;
  const text = controlled ? value : uncontrolled;
  const setText = useCallback(
    (next: string) => {
      const expanded = expandSavedReplyShortcut(next, savedReplies);
      if (!controlled) {
        setUncontrolled(expanded);
      }
      onChange?.(expanded);
    },
    [controlled, onChange, savedReplies],
  );
  const voiceActive = recorder.state !== "idle";
  const fieldLabel =
    placeholder ?? (editing ? t("composer.placeholder_edit") : t("composer.placeholder"));

  const emitSend = useCallback(
    (silent: boolean) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }
      onSend({ silent, text: trimmed });
      setText("");
      setSendMenuOpen(false);
    },
    [onSend, setText, text],
  );

  const deliverVoice = useCallback(
    (blob: Blob) => {
      onVoiceSend?.({
        blob,
        durationMs: recorder.durationMs,
        mimeType: recorder.mimeType,
        peaks: selectVoicePeaks(recorder.finalPeaks, recorder.peaks),
      });
      recorder.cancel();
    },
    [onVoiceSend, recorder],
  );

  const emitVoice = useCallback(() => {
    if (recorder.previewBlob && recorder.state === "paused" && !recorder.canResume) {
      deliverVoice(recorder.previewBlob);
      return;
    }
    pendingVoiceSend.current = true;
    recorder.stop();
  }, [deliverVoice, recorder]);

  useEffect(() => {
    if (!pendingVoiceSend.current) {
      return;
    }
    if (recorder.state !== "paused" || recorder.canResume || !recorder.previewBlob) {
      return;
    }
    pendingVoiceSend.current = false;
    deliverVoice(recorder.previewBlob);
  }, [deliverVoice, recorder.canResume, recorder.previewBlob, recorder.state]);

  useEffect(() => {
    if (!sendMenuOpen) {
      return;
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === SHORTCUTS.popLayer) {
        event.stopImmediatePropagation();
        setSendMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sendMenuOpen]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (voiceActive) {
      emitVoice();
      return;
    }
    emitSend(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === SHORTCUTS.send && !event.shiftKey) {
      event.preventDefault();
      emitSend(false);
    }
    if (event.key === SHORTCUTS.editLast && !text.trim()) {
      event.preventDefault();
      onEditLast?.();
    }
    if (event.key === SHORTCUTS.popLayer) {
      if (pickerOpen) {
        event.stopPropagation();
        setPickerOpen(false);
        return;
      }
      if (sendMenuOpen) {
        event.stopPropagation();
        setSendMenuOpen(false);
        return;
      }
      if (editing) {
        event.stopPropagation();
        onDismissEdit?.();
        return;
      }
      if (replyTo) {
        event.stopPropagation();
        onDismissReply?.();
      }
    }
  };

  const pressHold = usePressHold({
    enabled: !voiceActive,
    onClick: () => emitSend(false),
    onHold: () => setSendMenuOpen(true),
  });

  const menuItems = [
    {
      hidden: editing,
      icon: Paperclip,
      key: "attach",
      label: t("composer.attach_files"),
      onClick: () => onAttach?.(),
    },
    {
      hidden: editing,
      icon: Calendar,
      key: "schedule",
      label: t("composer.schedule"),
      onClick: () => onSchedule?.(),
    },
    {
      hidden: false,
      icon: Sparkles,
      key: "rewrite",
      label: t("composer.rewrite"),
      onClick: () => onRewrite?.(),
    },
    {
      hidden: editing,
      icon: Send,
      key: "silent",
      label: t("composer.send_silent"),
      onClick: () => emitSend(true),
    },
  ].filter((item) => !item.hidden);

  const fallbackCommands: SlashCommand[] = [
    {
      clientAction: "open_sticker_picker",
      description: t("picker.slash_stickers"),
      name: "sticker",
      source: "builtin",
    },
    {
      clientAction: "open_gif_picker",
      description: t("picker.slash_gifs"),
      name: "gif",
      source: "builtin",
    },
    { description: t("slash.help"), name: "help", source: "builtin" },
  ];
  const catalogCommands = slashCommands.length > 0 ? slashCommands : fallbackCommands;
  const menuCommands = [...catalogCommands, ...savedRepliesAsCommands(savedReplies)];
  const slashMatches = slashMenuOpen(text) ? filterCommands(menuCommands, text) : [];

  function openPicker(tab: PickerTab): void {
    setPickerTab(tab);
    setPickerOpen(true);
  }

  function onSlashSelect(command: SlashCommand): void {
    if (isPickerCommand(command)) {
      const tab = pickerTabForSlash(command.name);
      if (tab) {
        setText("");
        openPicker(tab);
      }
      return;
    }
    if (command.source === "saved_reply") {
      setText(`${command.description} `);
      return;
    }
    setText(`/${command.name} `);
  }

  return (
    <div
      className="relative border-t border-[var(--border-subtle)] bg-[var(--surface-panel)]"
      data-composer=""
      data-composer-row={voiceActive ? "voice" : "compose"}
    >
      <ComposerStrip
        editing={editing}
        onDismiss={editing ? () => onDismissEdit?.() : () => onDismissReply?.()}
        replyTo={replyTo}
      />
      {scheduledLabel ? (
        <ComposerScheduleBar
          label={scheduledLabel}
          onClear={onClearSchedule}
          onOpen={onOpenSchedule}
        />
      ) : null}
      <ComposerAttachmentChips attachments={attachments} onRemove={onRemoveAttachment} />
      {provisional ? (
        <p
          className="px-[var(--space-3)] text-[length:var(--text-sm)] text-[var(--accent)]"
          data-ai-provisional=""
        >
          {t("ai.provisional")}
        </p>
      ) : null}
      {slashMatches.length > 0 ? (
        <div className="px-[var(--space-3)] pb-[var(--space-2)]">
          <SlashCommandMenu commands={menuCommands} onSelect={onSlashSelect} query={text} />
        </div>
      ) : null}
      <form
        className="flex items-end gap-[var(--control-gap-tight)] px-[var(--space-3)] py-[var(--space-2)]"
        onSubmit={onSubmit}
      >
        {voiceActive ? (
          <VoiceRecorder
            onCancel={() => {
              pendingVoiceSend.current = false;
            }}
            onSend={emitVoice}
            recorder={recorder}
          />
        ) : (
          <>
            <IconButton
              aria-label={t("composer.mic")}
              onClick={() => void recorder.start()}
              type="button"
            >
              <Mic className={ICON_CLASS} />
            </IconButton>
            <Textarea
              aria-label={fieldLabel}
              className="max-h-[var(--composer-textarea-max-height)] min-h-[var(--control-height)] flex-1"
              onChange={(event) => setText(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={fieldLabel}
              rows={1}
              value={text}
            />
            <div className="relative">
              {sendMenuOpen ? (
                <>
                  <DismissLayer label={t("ui.close")} onDismiss={() => setSendMenuOpen(false)} />
                  <div
                    className={cn(
                      MENU_CONTENT_CLASS,
                      "absolute right-0 bottom-full z-[var(--z-menu)] mb-[var(--space-2)]",
                    )}
                    role="menu"
                  >
                    {menuItems.map((item) => (
                      <Button
                        className={cn(
                          MENU_ITEM_CLASS,
                          "w-full justify-start gap-[var(--space-2)]",
                          item.key === "rewrite" && MENU_ITEM_AI_CLASS,
                        )}
                        key={item.key}
                        onClick={() => {
                          item.onClick();
                          setSendMenuOpen(false);
                        }}
                        role="menuitem"
                        variant="ghost"
                      >
                        <item.icon className={ICON_CLASS} />
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </>
              ) : null}
              <Button
                aria-label={t("composer.send")}
                data-composer-primary="send"
                onContextMenu={pressHold.onContextMenu}
                onPointerCancel={pressHold.onPointerCancel}
                onPointerDown={pressHold.onPointerDown}
                onPointerMove={pressHold.onPointerMove}
                onPointerUp={pressHold.onPointerUp}
                size="icon"
                type="button"
                variant="primary"
              >
                <Send className={ICON_CLASS} />
              </Button>
            </div>
          </>
        )}
      </form>
      {pickerOpen ? (
        <Suspense fallback={null}>
          <PickerSheet
            gifUnavailable={gifUnavailable}
            gifs={gifs}
            initialTab={pickerTab}
            onGifQueryChange={onGifQueryChange}
            onOpenChange={setPickerOpen}
            onPickEmoji={(emoji) => setText(`${text}${emoji}`)}
            onPickGif={(gif) => {
              setPickerOpen(false);
              onPickGif?.(gif);
            }}
            onPickReply={(reply) => {
              setPickerOpen(false);
              setText(`${reply.body} `);
            }}
            onPickSticker={(sticker) => {
              setPickerOpen(false);
              onPickSticker?.(sticker);
            }}
            open={pickerOpen}
            remoteGifs={remoteGifs}
            replies={savedReplies}
            stickers={stickers}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
