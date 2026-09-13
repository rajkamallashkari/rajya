import { Phone, Search, Video } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { getAccessSession } from "@/features/auth/model/access-session";
import {
  isNewBotConversation,
  MemoryNotice,
  SmartReplyChips,
  SummarizeCard,
} from "@/features/bots";
import {
  useRewrite,
  useSuggestReplies,
  useSummarize,
  useTranslateMessage,
} from "@/features/bots/api/queries";
import { startCall } from "@/features/calls/lib";
import { Composer, ScheduleSheet, type ComposerAttachment } from "@/features/composer";
import {
  gifsFromList,
  slashCommandsFromApi,
  stickerViewsFromPacks,
  type GifView,
  type StickerView,
} from "@/features/composer/model/picker";
import {
  postReceipts,
  listMessages,
  type Conversation,
  type Message,
} from "@/features/conversations/api/http";
import {
  useBulkForward,
  useBulkSave,
  useBulkUnsend,
  useCancelGeneration,
  useConversation,
  useConversationCommands,
  useCreateReminder,
  useEditMessage,
  useJumpToMessage,
  useMessageInfo,
  useMessagePage,
  usePinMessage,
  usePinnedIds,
  usePinnedMessages,
  usePollResults,
  useReactMessage,
  useReactionDetails,
  useRegenerateMessage,
  useSaveMessage,
  useSavedIds,
  useSavedReplies,
  useSendMessage,
  useUnsendMessage,
  useVotePoll,
} from "@/features/conversations/api/queries";
import { ConversationScheduledMessages } from "@/features/conversations/components/conversation-scheduled-messages";
import { PinnedMessageBanner } from "@/features/conversations/components/pinned-message-banner";
import { MessageInfoSheet } from "@/features/conversations/components/message-info-sheet";
import { ReminderSheet } from "@/features/conversations/components/reminder-sheet";
import { ReportHost } from "@/features/conversations/components/report-host";
import { VirtualizedThread } from "@/features/conversations/components/virtualized-thread";
import { useConversationChannel } from "@/features/conversations/hooks/use-conversation-channel";
import { useGeneration } from "@/features/conversations/hooks/use-generation";
import { useTypingIndicators } from "@/features/conversations/hooks/use-typing-indicators";
import {
  canRegenerateBotReply,
  generationSenderName,
} from "@/features/conversations/model/generation";
import { conversationById, type DemoMessage } from "@/features/conversations/model/demo";
import { newClientNonce, parseConversationId } from "@/features/conversations/model/ids";
import { conversationTitle } from "@/features/conversations/model/title";
import type { ThreadRun } from "@/features/conversations/model/thread-window";
import { useGifSearch, useRetryTranscript, useStickerPacks } from "@/features/media/api/queries";
import { presignAndUpload } from "@/features/media/model/direct-upload";
import {
  CallMessageBubble,
  MessageBubble,
  MessageContextMenu,
  MessageGroup,
  PermissionSystemMessage,
  PollResultsSheet,
  ReactionDetailsSheet,
  SelectionToolbar,
  StreamingBubble,
  SystemMessage,
  TypingBubble,
  type MessageMenuActions,
  type SystemEventKey,
} from "@/features/messages";
import { tickStatus } from "@/features/messages/model/ticks";
import { copyText } from "@/features/messages/model/copy-text";
import { callMetadata } from "@/features/messages/components/call-message-bubble";
import { bubbleRole } from "@/features/messages/model/grouping";
import {
  contactViewFromApi,
  locationViewFromApi,
  pollViewFromApi,
} from "@/features/messages/model/poll";
import { LayerHeader } from "@/app/navigation/layer-header";
import { useMobileViewport } from "@/shared/hooks/use-mobile-viewport";
import { conversationLayer, useLayerStore } from "@/shared/lib/navigation/layer-store";
import { ChatSearchBar, JumpDateSheet, SearchResultsPanel } from "@/features/search";
import { useConversationSearch } from "@/features/search/api/queries";
import { useDebouncedValue } from "@/features/search/hooks/use-debounced-value";
import { SEARCH_DEBOUNCE_MS } from "@/features/search/model/constants";
import { serializeFilters } from "@/features/search/model/filters";
import { wrapMatchIndex } from "@/features/search/model/highlight";
import { resetSearchStore, useSearchStore } from "@/features/search/store/search-store";
import {
  useBlocks,
  useCreateScheduledMessage,
  usePreferences,
  useUpdatePreferences,
} from "@/features/settings/api/queries";
import { asPreferenceDocument } from "@/features/settings/model/map-preferences";
import { DEFAULT_QUICK_REACTIONS } from "@/features/messages/model/menu";
import { parseWallpaper, resolveAppearance, wallpaperLayerStyle } from "@/shared/lib/theme";
import { useThemeControls } from "@/app/theme-provider";
import { AccountIdentityRow } from "@/shared/ui/account-identity-row";
import { ConversationIdentityRow } from "@/shared/ui/conversation-identity-row";
import { IconButton } from "@/shared/ui/icon-button";
import { showToast } from "@/shared/ui/toast";
import { ListView } from "@/shared/ui/list-view";

const THREAD_SURFACE = "chat-wallpaper flex h-full min-h-0 flex-col bg-[var(--surface-chat)]";
const CALL_SYSTEM_EVENTS = new Set(["call_ended", "call_missed", "call_started"]);

export function fileUniquenessKey(file: File): string {
  return JSON.stringify([
    file.name || "(unnamed)",
    file.size,
    file.type || "(unknown)",
    file.lastModified,
  ]);
}

export function appendUniqueAttachments(
  current: Array<ComposerAttachment & { file: File }>,
  files: File[],
  createId: () => string = () => crypto.randomUUID(),
): Array<ComposerAttachment & { file: File }> {
  const keys = new Set(current.map((attachment) => fileUniquenessKey(attachment.file)));
  const additions: Array<ComposerAttachment & { file: File }> = [];
  for (const file of files) {
    const key = fileUniquenessKey(file);
    if (keys.has(key)) {
      continue;
    }
    keys.add(key);
    additions.push({ file, id: createId(), name: file.name });
  }
  return additions.length > 0 ? [...current, ...additions] : current;
}

export function ConversationThread({ conversationId }: { conversationId: string }): ReactNode {
  const liveId = parseConversationId(conversationId);
  if (liveId != null) {
    return <LiveThread conversationId={liveId} />;
  }
  const conversation = conversationById(conversationId);
  if (!conversation) {
    return null;
  }
  return (
    <DemoThread conversation={conversation} conversationId={conversationId} key={conversationId} />
  );
}

function DemoThread({
  conversation,
  conversationId,
}: {
  conversation: NonNullable<ReturnType<typeof conversationById>>;
  conversationId: string;
}): ReactNode {
  const pushLayer = useLayerStore((state) => state.pushLayer);
  const mobile = useMobileViewport();
  const [messages, setMessages] = useState<DemoMessage[]>(conversation.messages);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const received = messages.filter((message) => message.side === "received");
  const sent = messages.filter((message) => message.side === "sent");
  const lastSent = [...sent].reverse()[0];

  return (
    <div className={THREAD_SURFACE} data-conversation-thread="">
      <LayerHeader
        onTitleClick={() =>
          pushLayer({
            conversationId,
            id: `profile:${conversationId}`,
            kind: "profile",
            title: conversation.name,
          })
        }
        showBack={mobile}
        title={
          <AccountIdentityRow
            account={{
              display_name: conversation.name,
              id: 0,
              kind: "human",
              username: "",
            }}
            compact
          />
        }
      />
      <div
        className="flex min-h-0 flex-1 flex-col gap-[var(--space-4)] overflow-y-auto px-[var(--space-list-x)] py-[var(--space-list-y)]"
        data-layer-scroll={conversationId}
      >
        {received.length > 0 ? (
          <MessageGroup
            messages={received}
            senderName={conversation.name}
            showAvatar={false}
            side="received"
          />
        ) : null}
        {sent.length > 0 ? <MessageGroup messages={sent} side="sent" /> : null}
      </div>
      <Composer
        editing={editingId !== null}
        onChange={setDraft}
        onDismissEdit={() => {
          setEditingId(null);
          setDraft("");
        }}
        onEditLast={() => {
          if (!lastSent) {
            return;
          }
          setEditingId(lastSent.id);
          setDraft(lastSent.body);
        }}
        onSend={({ text }) => {
          if (editingId) {
            setMessages((current) =>
              current.map((message) =>
                message.id === editingId ? { ...message, body: text } : message,
              ),
            );
            setEditingId(null);
          } else {
            setMessages((current) => [
              ...current,
              { body: text, id: `local-${current.length}`, side: "sent" },
            ]);
          }
          setDraft("");
        }}
        value={draft}
      />
    </div>
  );
}

function LiveThread({ conversationId }: { conversationId: number }): ReactNode {
  const { t, i18n } = useTranslation();
  const { input } = useThemeControls();
  const preferences = usePreferences();
  const updatePreferences = useUpdatePreferences();
  const blocks = useBlocks();
  const { cancelGeneration, publishActivity } = useConversationChannel(conversationId);
  const typists = useTypingIndicators(conversationId);
  const generation = useGeneration(conversationId);
  const conversationQuery = useConversation(conversationId);
  const page = useMessagePage(conversationId);
  const send = useSendMessage(conversationId);
  const schedule = useCreateScheduledMessage();
  const edit = useEditMessage(conversationId);
  const react = useReactMessage(conversationId);
  const pin = usePinMessage(conversationId);
  const save = useSaveMessage();
  const unsend = useUnsendMessage(conversationId);
  const regenerate = useRegenerateMessage(conversationId);
  const cancel = useCancelGeneration(conversationId);
  const bulkUnsend = useBulkUnsend(conversationId);
  const bulkSave = useBulkSave();
  const bulkForward = useBulkForward(conversationId);
  const vote = useVotePoll(conversationId);
  const pinned = usePinnedIds(conversationId);
  const pinnedMessages = usePinnedMessages(conversationId);
  const saved = useSavedIds();
  const savedReplies = useSavedReplies();
  const commands = useConversationCommands(conversationId);
  const packs = useStickerPacks();
  const transcribe = useRetryTranscript();
  const [gifQuery, setGifQuery] = useState("");
  const gifs = useGifSearch(gifQuery);
  const remind = useCreateReminder();
  const rewrite = useRewrite();
  const translate = useTranslateMessage();
  const suggest = useSuggestReplies(conversationId);
  const summarize = useSummarize(conversationId);
  const [infoId, setInfoId] = useState<number | null>(null);
  const [remindId, setRemindId] = useState<number | null>(null);
  const [resultsPollId, setResultsPollId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [reactionsId, setReactionsId] = useState<number | null>(null);
  const info = useMessageInfo(infoId);
  const results = usePollResults(resultsPollId);
  const reactions = useReactionDetails(reactionsId);
  const focusMessageId = useLayerStore(
    (state) =>
      state.layers.find(
        (layer) => layer.kind === "conversation" && layer.conversationId === String(conversationId),
      )?.focusMessageId,
  );
  const jump = useJumpToMessage(
    conversationId,
    focusMessageId ? { messageId: Number(focusMessageId) } : {},
  );
  const pushLayer = useLayerStore((state) => state.pushLayer);
  const popLayer = useLayerStore((state) => state.popLayer);
  const openConversation = useLayerStore((state) => state.openConversation);
  const chatOpen = useSearchStore((state) => state.chatOpen);
  const openChatSearch = useSearchStore((state) => state.openChatSearch);
  const setDateOpen = useSearchStore((state) => state.setDateOpen);
  const searchQuery = useSearchStore((state) => state.query);
  const searchMode = useSearchStore((state) => state.mode);
  const searchFilters = useSearchStore((state) => state.filters);
  const [matchIndex, setMatchIndex] = useState(0);
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
  const conversationSearch = useConversationSearch(conversationId, debouncedSearch, searchFilters);
  const jumpedQuery = useRef("");
  const originScrollTop = useRef<number | null>(null);
  const [restoreEpoch, setRestoreEpoch] = useState(0);
  const [restoreScrollTop, setRestoreScrollTop] = useState<number | null>(null);
  const mobile = useMobileViewport();
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<Array<ComposerAttachment & { file: File }>>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [provisional, setProvisional] = useState(false);
  const [replyChips, setReplyChips] = useState<string[]>([]);
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [summary, setSummary] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [menu, setMenu] = useState<{
    id: number;
    x: number;
    y: number;
  } | null>(null);
  const [reportId, setReportId] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const scroller = useRef<HTMLElement | null>(null);
  const viewerId = getAccessSession()?.accountId ?? 0;
  const listed = page.messages;
  const jumped = jump.data?.messages ?? [];
  const focusId = focusMessageId ? Number(focusMessageId) : null;
  const messages =
    focusId != null && !listed.some((row) => row.id === focusId) && jumped.length > 0
      ? jumped
      : listed;
  const conversation = conversationQuery.data;
  const blockedPeer =
    conversation?.kind === "direct" &&
    conversation.peer != null &&
    blocks.data?.blocks.some((block) => block.account.id === conversation.peer?.id);
  const title = conversation ? conversationTitle(conversation, t("conversations.untitled")) : "";
  const membershipWallpaper = parseWallpaper(conversation?.wallpaper);
  const wallpaperStyle = membershipWallpaper
    ? (wallpaperLayerStyle(
        membershipWallpaper,
        resolveAppearance(input.appearance).reduceTransparency,
      ) as CSSProperties)
    : undefined;
  const quickReactions = asPreferenceDocument(preferences.data?.data)?.chat?.quick_reactions ?? [
    ...DEFAULT_QUICK_REACTIONS,
  ];
  const addAttachments = (files: File[]): void => {
    setAttachments((current) => appendUniqueAttachments(current, files));
  };

  useEffect(() => {
    jumpedQuery.current = "";
    originScrollTop.current = null;
    setRestoreEpoch(0);
    setRestoreScrollTop(null);
    resetSearchStore();
  }, [conversationId]);

  useEffect(() => {
    useSearchStore.getState().setMembers(conversation?.members ?? []);
  }, [conversation]);

  const lastSent = [...messages].reverse().find((message) => message.sender?.id === viewerId);
  const newestPosition = messages.reduce((max, message) => Math.max(max, message.position), 0);

  useEffect(() => {
    if (newestPosition < 1) {
      return;
    }
    void postReceipts(conversationId, "viewed", newestPosition).catch(() => undefined);
  }, [conversationId, newestPosition]);

  const searchHits = useMemo(
    () => conversationSearch.data?.messages ?? [],
    [conversationSearch.data?.messages],
  );

  const pushJumpFromScroller = useCallback((): void => {
    const scrollTop = jumpRestoreTop(originScrollTop.current, scroller.current);
    originScrollTop.current = null;
    useSearchStore.getState().pushJump({
      conversationId: String(conversationId),
      scrollTop,
    });
  }, [conversationId]);

  const restoreThreadScroll = (scrollTop: number): void => {
    openConversation(conversationLayer(String(conversationId), title));
    setRestoreScrollTop(scrollTop);
    setRestoreEpoch((current) => current + 1);
  };

  useEffect(() => {
    const first = searchHits[0];
    const jumpKey = `${debouncedSearch}|${serializeFilters(searchFilters)}`;
    if (!chatOpen || searchMode !== "navigate" || !first || jumpedQuery.current === jumpKey) {
      return;
    }
    jumpedQuery.current = jumpKey;
    setMatchIndex(0);
    pushJumpFromScroller();
    openConversation(conversationLayer(String(conversationId), title, String(first.message_id)));
  }, [
    chatOpen,
    conversationId,
    debouncedSearch,
    openConversation,
    pushJumpFromScroller,
    searchFilters,
    searchHits,
    searchMode,
    title,
  ]);

  const onThreadBack = (): void => {
    const restored = useSearchStore.getState().handleBack();
    if (restored && restored !== "closed") {
      restoreThreadScroll(restored.scrollTop);
      return;
    }
    if (restored === "closed") {
      if (originScrollTop.current != null) {
        restoreThreadScroll(originScrollTop.current);
        originScrollTop.current = null;
      }
      return;
    }
    popLayer();
  };

  const jumpToHit = (messageId: number, index: number): void => {
    setMatchIndex(index);
    pushJumpFromScroller();
    openConversation(conversationLayer(String(conversationId), title, String(messageId)));
  };

  const sendWithAttachments = async (body: string, silent: boolean): Promise<void> => {
    const pending = [...attachments];
    try {
      const signedIds = await Promise.all(pending.map((row) => presignAndUpload(row.file)));
      send.mutate({
        attachment_signed_ids: signedIds,
        body: body || undefined,
        client_nonce: newClientNonce(),
        optimistic_attachments: pending.map((row, index) => ({
          byte_size: row.file.size,
          content_type: row.file.type || "application/octet-stream",
          filename: row.file.name,
          id: -(Date.now() + index + 1),
          kind: row.file.type.startsWith("image/")
            ? "image"
            : row.file.type.startsWith("video/")
              ? "video"
              : row.file.type.startsWith("audio/")
                ? "audio"
                : "file",
          processing_status: "pending",
        })),
        silent,
      });
      setAttachments((current) => current.filter((row) => !pending.includes(row)));
    } catch {
      // Chips stay so the user can retry; restore the caption the composer cleared.
      setDraft(body);
    }
  };

  if (conversationQuery.isPending || page.isPending) {
    return (
      <div className={THREAD_SURFACE} data-conversation-thread="">
        <ListView status="loading">{null}</ListView>
      </div>
    );
  }
  if (conversationQuery.isError || page.isError || !conversation) {
    return null;
  }

  return (
    <div className={THREAD_SURFACE} data-conversation-thread="" style={wallpaperStyle}>
      <LayerHeader
        onBack={onThreadBack}
        onTitleClick={() =>
          pushLayer({
            conversationId: String(conversationId),
            id: `profile:${String(conversationId)}`,
            kind: "profile",
            title,
          })
        }
        showBack={mobile}
        title={<ConversationIdentityRow compact conversation={conversation} />}
      >
        {chatOpen ? (
          <ChatSearchBar
            conversationId={conversationId}
            matchIndex={matchIndex}
            onCycle={(delta) => {
              const next = wrapMatchIndex(matchIndex, searchHits.length, delta);
              const hit = searchHits[next];
              if (hit) {
                jumpToHit(hit.message_id, next);
              }
            }}
          />
        ) : (
          <>
            {conversation.kind !== "channel" && viewerId > 0 ? (
              <>
                <IconButton
                  aria-label={t("calls.start_audio")}
                  onClick={() => void startCall(conversationId, "audio", viewerId)}
                  type="button"
                >
                  <Phone className="h-[var(--icon-size)] w-[var(--icon-size)]" />
                </IconButton>
                <IconButton
                  aria-label={t("calls.start_video")}
                  onClick={() => void startCall(conversationId, "video", viewerId)}
                  type="button"
                >
                  <Video className="h-[var(--icon-size)] w-[var(--icon-size)]" />
                </IconButton>
              </>
            ) : null}
            <IconButton
              aria-label={t("search.open")}
              onClick={() => {
                originScrollTop.current = jumpRestoreTop(null, scroller.current);
                openChatSearch();
              }}
              type="button"
            >
              <Search className="h-[var(--icon-size)] w-[var(--icon-size)]" />
            </IconButton>
          </>
        )}
      </LayerHeader>
      {blockedPeer ? (
        <p
          className="bg-[var(--surface-muted)] px-[var(--space-list-x)] py-[var(--space-2)] text-center text-[length:var(--text-sm)] text-[var(--text-secondary)]"
          data-blocked-banner=""
        >
          {t("conversations.blocked_banner")}
        </p>
      ) : null}
      <PinnedMessageBanner
        canUnpin={Boolean(conversation.permissions.pin_messages)}
        onJump={(messageId) => {
          pushJumpFromScroller();
          openConversation(conversationLayer(String(conversationId), title, String(messageId)));
        }}
        onUnpin={(messageId) => pin.mutate({ messageId, pinned: true })}
        pins={pinnedMessages.data?.pinned_messages ?? []}
        viewerId={viewerId}
      />
      {chatOpen ? (
        <SearchResultsPanel
          conversationId={conversationId}
          onJump={(hit, index) => jumpToHit(hit.message_id, index)}
        />
      ) : null}
      <JumpDateSheet
        onJump={(iso) => {
          setDateOpen(false);
          pushJumpFromScroller();
          openConversation(conversationLayer(String(conversationId), title));
          void listMessages(conversationId, { around_at: iso }).then((page) => {
            const pivot = page.meta.pivot_id;
            if (pivot != null) {
              openConversation(conversationLayer(String(conversationId), title, String(pivot)));
            }
          });
        }}
      />
      {selectedIds.length > 0 ? (
        <SelectionToolbar
          count={selectedIds.length}
          onClear={() => setSelectedIds([])}
          onCopy={() => {
            const text = messages
              .filter((row) => selectedIds.includes(row.id) && row.body)
              .map((row) => row.body)
              .join("\n");
            void copyText(text);
          }}
          onDelete={() => {
            bulkUnsend.mutate(selectedIds);
            setSelectedIds([]);
          }}
          onForward={() => {
            bulkForward.mutate({ messageIds: selectedIds, targetId: conversationId });
            setSelectedIds([]);
          }}
          onSave={() => {
            bulkSave.mutate(selectedIds);
            setSelectedIds([]);
          }}
          onSelectAll={() => setSelectedIds(messages.map((row) => row.id))}
          restrictForwarding={Boolean(conversation.restrict_forwarding)}
        />
      ) : null}
      <VirtualizedThread
        accountIds={conversation.members.map((member) => member.account.id)}
        conversationId={String(conversationId)}
        focusMessageId={focusMessageId}
        footer={
          <>
            {typists.map((typist) => (
              <TypingBubble
                activity={typist.activity}
                key={typist.accountId}
                senderName={typist.displayName}
              />
            ))}
            {generation ? (
              <StreamingBubble
                onCancel={() => {
                  cancelGeneration(generation.generationId);
                  cancel.mutate(generation.generationId);
                }}
                senderName={generationSenderName(
                  generation,
                  conversation,
                  t("conversations.untitled"),
                )}
                text={generation.text}
              />
            ) : null}
          </>
        }
        header={
          <>
            {isNewBotConversation(conversation, messages) ? <MemoryNotice /> : null}
            {conversation.unread_count > 1 ? (
              <SummarizeCard
                onSummarize={() => {
                  summarize.mutate("unread", {
                    onSuccess: (result) => setSummary(result.text),
                  });
                }}
                pending={summarize.isPending}
                text={summary}
              />
            ) : null}
          </>
        }
        hasMoreOlder={Boolean(page.hasNextPage)}
        loadingOlder={page.isFetchingNextPage}
        locale={i18n.language}
        messages={messages}
        onDateClick={() => setDateOpen(true)}
        onLoadOlder={() => {
          void page.fetchNextPage();
        }}
        renderRun={(run) => (
          <ThreadRunView
            conversation={conversation}
            conversationId={conversationId}
            onOpenMenu={(id, point) => setMenu({ id, x: point.clientX, y: point.clientY })}
            onOpenPollResults={(id) => setResultsPollId(pollResultsId(messages, id))}
            onToggleReaction={(id, emoji, mine) => react.mutate({ emoji, id, mine })}
            onVote={(id, optionIds) => voteFromThread(messages, id, optionIds, vote.mutate)}
            run={run}
            translations={translations}
            untitled={t("conversations.untitled")}
            viewerId={viewerId}
          />
        )}
        restoreEpoch={restoreEpoch}
        restoreScrollTop={restoreScrollTop}
        scrollerRef={scroller}
      />
      {conversation.slow_mode_seconds > 0 ? (
        <p
          className="px-[var(--space-list-x)] py-[var(--space-2)] text-[var(--text-secondary)]"
          data-slow-mode-hint=""
        >
          {t("conversations.slow_mode.hint", { seconds: conversation.slow_mode_seconds })}
        </p>
      ) : null}
      <SmartReplyChips
        onPick={(text) => {
          setDraft(text);
          setProvisional(true);
          setReplyChips([]);
        }}
        suggestions={replyChips}
      />
      <ConversationScheduledMessages conversationId={conversationId} />
      <Composer
        attachments={attachments}
        editing={editingId !== null}
        onAttach={() => fileInput.current?.click()}
        onChange={(value) => {
          setDraft(value);
          if (value.trim()) {
            publishActivity("typing");
          }
        }}
        onDismissEdit={() => {
          setEditingId(null);
          setDraft("");
          setProvisional(false);
        }}
        onEditLast={() => {
          if (!lastSent?.body) {
            return;
          }
          setEditingId(lastSent.id);
          setDraft(lastSent.body);
          setProvisional(false);
        }}
        onRemoveAttachment={(id) =>
          setAttachments((current) => current.filter((attachment) => attachment.id !== id))
        }
        onRewrite={() => {
          if (!draft.trim()) {
            return;
          }
          rewrite.mutate(
            {
              conversation_id: conversationId,
              instruction: t("ai.rewrite_instruction"),
              text: draft,
            },
            {
              onError: () => {
                showToast({ title: t("ai.rewrite_failed"), variant: "danger" });
              },
              onSuccess: (result) => {
                setDraft(result.text);
                setProvisional(true);
                setReplyChips(result.suggested_chips);
              },
            },
          );
        }}
        onSchedule={() => setScheduleOpen(true)}
        onSend={({ silent, text }) => {
          if (editingId) {
            edit.mutate({ body: text, id: editingId });
            setEditingId(null);
          } else if (attachments.length > 0) {
            void sendWithAttachments(text, silent);
          } else {
            send.mutate({ body: text, client_nonce: newClientNonce(), silent });
          }
          setDraft("");
          setProvisional(false);
          setReplyChips([]);
        }}
        onVoiceSend={({ blob, durationMs, mimeType, peaks }) => {
          send.mutate({
            client_nonce: newClientNonce(),
            voice: { blob, durationMs, mimeType, peaks },
          });
        }}
        onGifQueryChange={setGifQuery}
        onFiles={addAttachments}
        onPickGif={(gif: GifView) => {
          send.mutate({ client_nonce: newClientNonce(), gif_id: gif.id });
        }}
        onPickSticker={(sticker: StickerView) => {
          send.mutate({ client_nonce: newClientNonce(), sticker_id: Number(sticker.id) });
        }}
        remoteGifs
        scheduleAvailable={draft.trim().length > 0 && attachments.length === 0}
        gifUnavailable={gifs.isError}
        gifs={gifsFromList(gifs.data?.gifs)}
        savedReplies={savedReplyViews(savedReplies.data?.saved_replies)}
        slashCommands={slashCommandsFromApi(commands.data?.commands)}
        stickers={stickerViewsFromPacks(packs.data?.sticker_packs)}
        provisional={provisional}
        value={draft}
      />
      <input
        aria-label={t("composer.attach_files")}
        className="hidden"
        multiple
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          addAttachments(files);
          event.currentTarget.value = "";
        }}
        ref={fileInput}
        type="file"
      />
      <ScheduleSheet
        onConfirm={(scheduledAt) => {
          schedule.mutate(
            {
              body: draft,
              client_nonce: newClientNonce(),
              conversation_id: conversationId,
              scheduled_at: scheduledAt,
            },
            {
              onError: () => {
                showToast({ title: t("composer.schedule_failed"), variant: "danger" });
              },
              onSuccess: () => {
                setDraft("");
                setProvisional(false);
                setReplyChips([]);
                setScheduleOpen(false);
              },
            },
          );
        }}
        onOpenChange={setScheduleOpen}
        open={scheduleOpen}
      />
      {menu ? (
        <MessageContextMenu
          actions={buildMessageMenuActions({
            message: messages.find((row) => row.id === menu.id),
            onCopy: (body) => {
              void navigator.clipboard?.writeText(body);
            },
            onEdit: (id, body) => {
              setEditingId(id);
              setDraft(body);
            },
            onInfo: setInfoId,
            onPin: (id) => pin.mutate({ messageId: id, pinned: (pinned.data ?? []).includes(id) }),
            onReact: (id, emoji) => {
              const message = messages.find((row) => row.id === id);
              react.mutate({ emoji, id, mine: message?.my_reactions?.includes(emoji) });
            },
            onReactions: setReactionsId,
            onRemind: setRemindId,
            onRegenerate: (id) => regenerate.mutate(id),
            onReport: setReportId,
            onSave: (id) => save.mutate(id),
            onSelect: (id) =>
              setSelectedIds((current) => (current.includes(id) ? current : [...current, id])),
            onSuggestReply: (id) => {
              suggest.mutate(id, {
                onSuccess: (result) => setReplyChips(result.suggestions),
              });
            },
            onTranscribe: (attachmentId) => transcribe.mutate(attachmentId),
            onTranslate: (id) => {
              translate.mutate(
                { id, targetLanguage: i18n.language },
                {
                  onSuccess: (result) =>
                    setTranslations((current) => ({ ...current, [id]: result.text })),
                },
              );
            },
            onUnsend: (id) => unsend.mutate(id),
            onUpdateQuickReactions: (next) =>
              updatePreferences.mutate({ chat: { quick_reactions: next } }),
            pinned: pinned.data ?? [],
            quickReactions,
            restrictForwarding: Boolean(conversation.restrict_forwarding),
            saved: saved.data,
            viewerId,
          })}
          onClose={() => setMenu(null)}
          x={menu.x}
          y={menu.y}
        />
      ) : null}
      <ReminderSheet
        onOpenChange={(open) => {
          if (!open) {
            setRemindId(null);
          }
        }}
        onSubmit={({ note, remindAt }) => {
          if (remindId != null) {
            remind.mutate({ messageId: remindId, note, remindAt });
          }
        }}
        open={remindId != null}
      />
      <ReportHost
        onOpenChange={(open) => {
          if (!open) {
            setReportId(null);
          }
        }}
        open={reportId != null}
        subjectId={reportId ?? 0}
        subjectType="message"
      />
      <MessageInfoSheet
        conversationKind={conversation.kind}
        info={info.data}
        onOpenChange={(open) => setInfoId(nextInfoId(open, infoId))}
        open={infoId != null}
      />
      <ReactionDetailsSheet
        onOpenChange={(open) => {
          if (!open) {
            setReactionsId(null);
          }
        }}
        open={reactionsId != null}
        reactions={reactionDetailViews(reactions.data?.reactions)}
      />
      {results.data ? (
        <PollResultsSheet
          onOpenChange={(open) => {
            if (!open) {
              setResultsPollId(null);
            }
          }}
          open={resultsPollId != null}
          poll={pollViewFromApi(results.data)}
        />
      ) : null}
    </div>
  );
}

function ThreadRunView({
  conversation,
  conversationId,
  onOpenMenu,
  onOpenPollResults,
  onToggleReaction,
  onVote,
  run,
  translations = {},
  untitled,
  viewerId,
}: {
  conversation: Conversation;
  conversationId: number;
  onOpenMenu: (id: number, point: { clientX: number; clientY: number }) => void;
  onOpenPollResults: (id: number) => void;
  onToggleReaction: (id: number, emoji: string, mine: boolean) => void;
  onVote: (id: number, optionIds: string[]) => void;
  run: ThreadRun;
  translations?: Record<number, string>;
  untitled: string;
  viewerId: number;
}): ReactNode {
  const { t } = useTranslation();
  const pushLayer = useLayerStore((state) => state.pushLayer);
  const deleted = t("messages.deleted");
  if (run.kind === "system") {
    return (
      <div className="flex flex-col gap-[var(--space-0_5)]">
        {run.messages.map((item) => {
          const event = item.system_event ?? "";
          return (
            <div data-message-id={item.id} key={item.id}>
              {CALL_SYSTEM_EVENTS.has(event) ? (
                <CallMessageBubble
                  body={item.body}
                  createdAt={item.created_at}
                  event={event}
                  id={String(item.id)}
                  metadata={item.metadata}
                  viewerId={viewerId}
                />
              ) : event === "permissions_changed" ? (
                <PermissionSystemMessage body={item.body} metadata={item.metadata} />
              ) : (
                <SystemMessage eventKey={event as SystemEventKey} text={item.body} />
              )}
            </div>
          );
        })}
      </div>
    );
  }
  const count = run.messages.length;
  return (
    <div className="flex flex-col gap-[var(--space-0_5)]" data-message-group="">
      {run.messages.map((item, index) => {
        const event = item.system_event ?? "";
        const isCall = item.kind === "system" && CALL_SYSTEM_EVENTS.has(event);
        const initiatorId = isCall ? callMetadata(item.metadata).initiator_account_id : undefined;
        const sender = isCall
          ? conversation.members.find((member) => member.account.id === initiatorId)?.account
          : item.sender;
        const side = sender?.id === viewerId ? "sent" : "received";
        const showRunAvatar =
          side === "received" &&
          (conversation.kind === "group" || conversation.kind === "channel") &&
          sender != null;
        const role = bubbleRole(index, count);
        const avatarProps = {
          reserveAvatar: showRunAvatar && index < count - 1,
          role,
          senderName: sender?.display_name ?? untitled,
          senderSrc: sender?.avatar_url,
          showAvatar: showRunAvatar && index === count - 1,
        };

        return (
          <div data-message-id={item.id} key={item.id}>
            {isCall ? (
              <CallMessageBubble
                body={item.body}
                createdAt={item.created_at}
                event={event}
                id={String(item.id)}
                metadata={item.metadata}
                viewerId={viewerId}
                {...avatarProps}
              />
            ) : (
              <MessageBubble
                attachments={item.attachments}
                body={item.deleted ? deleted : (item.body ?? "")}
                contacts={(item.contacts ?? []).map(contactViewFromApi)}
                createdAt={item.created_at}
                id={String(item.id)}
                location={item.location ? locationViewFromApi(item.location) : undefined}
                onOpenContactProfile={(accountId, name) =>
                  pushLayer({
                    accountId,
                    conversationId: String(conversationId),
                    id: `account:${accountId}`,
                    kind: "profile",
                    title: name,
                  })
                }
                onOpenMenu={(point) => onOpenMenu(item.id, point)}
                onOpenPollResults={() => onOpenPollResults(item.id)}
                onToggleReaction={(emoji) =>
                  onToggleReaction(item.id, emoji, item.my_reactions?.includes(emoji) ?? false)
                }
                onVote={(optionIds) => onVote(item.id, optionIds)}
                poll={item.poll ? pollViewFromApi(item.poll) : undefined}
                reactions={Object.entries(item.reaction_summary ?? {})
                  .filter(([, reactionCount]) => reactionCount > 0)
                  .map(([emoji, reactionCount]) => ({
                    count: reactionCount,
                    emoji,
                    mine: item.my_reactions?.includes(emoji) ?? false,
                  }))}
                side={side}
                status={tickStatus(item)}
                translation={translations[item.id]}
                {...avatarProps}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function jumpRestoreTop(origin: number | null, node: { scrollTop: number } | null): number {
  return origin ?? node?.scrollTop ?? 0;
}

export function bindNumericId<T extends unknown[]>(
  handler: (id: number, ...rest: T) => void,
): (id: string, ...rest: T) => void {
  return (id, ...rest) => handler(Number(id), ...rest);
}

export function pollResultsId(messages: Message[], id: number): number | null {
  return messages.find((message) => message.id === id)?.poll?.id ?? null;
}

export function voteFromThread(
  messages: Message[],
  id: number,
  optionIds: string[],
  mutate: (payload: { optionIds: number[]; pollId: number }) => void,
): void {
  const payload = pollVotePayload(messages, id, optionIds);
  if (!payload) {
    return;
  }
  mutate(payload);
}

export function pollVotePayload(
  messages: Message[],
  id: number,
  optionIds: string[],
): { optionIds: number[]; pollId: number } | null {
  const poll = messages.find((message) => message.id === id)?.poll;
  if (!poll) {
    return null;
  }
  return { optionIds: optionIds.map(Number), pollId: poll.id };
}

export function reactionDetailViews(
  rows: Array<{ account: { display_name: string; id: number }; emoji: string }> | undefined,
): Array<{ accountId: string; emoji: string; name: string }> {
  return (rows ?? []).map((row) => ({
    accountId: String(row.account.id),
    emoji: row.emoji,
    name: row.account.display_name,
  }));
}

export function savedReplyViews(
  replies: Array<{ body: string; id: number; shortcut: string }> | undefined,
): Array<{ body: string; id: string; shortcut: string }> {
  return (replies ?? []).map((reply) => ({
    body: reply.body,
    id: String(reply.id),
    shortcut: reply.shortcut,
  }));
}

export function nextInfoId(open: boolean, current: number | null): number | null {
  if (!open) {
    return null;
  }
  return current;
}

export function buildMessageMenuActions({
  message,
  onCopy,
  onEdit,
  onInfo,
  onPin,
  onReact,
  onReactions,
  onRemind,
  onRegenerate,
  onReport,
  onSave,
  onSelect,
  onUnsend,
  onUpdateQuickReactions,
  pinned,
  quickReactions,
  restrictForwarding = false,
  saved,
  viewerId,
  onSuggestReply,
  onTranscribe,
  onTranslate,
}: {
  message: Message | undefined;
  onCopy: (body: string) => void;
  onEdit: (id: number, body: string) => void;
  onInfo: (id: number) => void;
  onPin: (id: number) => void;
  onReact: (id: number, emoji: string) => void;
  onReactions: (id: number) => void;
  onRemind: (id: number) => void;
  onRegenerate?: (id: number) => void;
  onReport?: (id: number) => void;
  onSave: (id: number) => void;
  onSelect: (id: number) => void;
  onSuggestReply?: (id: number) => void;
  onTranscribe?: (attachmentId: number) => void;
  onTranslate?: (id: number) => void;
  onUnsend: (id: number) => void;
  onUpdateQuickReactions?: (reactions: string[]) => void;
  pinned: number[];
  quickReactions?: string[];
  restrictForwarding?: boolean;
  saved: number[];
  viewerId: number;
}): MessageMenuActions {
  if (!message) {
    return {};
  }
  const isMine = message.sender?.id === viewerId;
  const canCopy = Boolean(message.body) && !restrictForwarding;
  const canReport = Boolean(onReport) && !isMine && !message.deleted && message.kind !== "system";
  const canRegenerate = Boolean(onRegenerate) && canRegenerateBotReply(message, viewerId);
  const voice = message.attachments?.find(
    (attachment) =>
      attachment.kind === "voice" &&
      (attachment.transcript_status == null || attachment.transcript_status === "failed"),
  );
  return {
    canEdit: isMine && !message.deleted && Boolean(message.body),
    hasText: canCopy,
    isMine,
    isPinned: pinned.includes(message.id),
    isSaved: saved.includes(message.id),
    onCopy: canCopy ? () => onCopy(message.body as string) : undefined,
    onEdit: message.body ? () => onEdit(message.id, message.body as string) : undefined,
    onInfo: () => onInfo(message.id),
    onPin: () => onPin(message.id),
    onReact: (emoji) => onReact(message.id, emoji),
    onReactions: () => onReactions(message.id),
    onRemind: () => onRemind(message.id),
    onRegenerate: canRegenerate ? () => onRegenerate?.(message.id) : undefined,
    onReport: canReport ? () => onReport?.(message.id) : undefined,
    onSave: () => onSave(message.id),
    onSelect: () => onSelect(message.id),
    onSuggestReply:
      Boolean(onSuggestReply) && canCopy ? () => onSuggestReply?.(message.id) : undefined,
    onTranscribe: Boolean(onTranscribe) && voice ? () => onTranscribe?.(voice.id) : undefined,
    onTranslate: Boolean(onTranslate) && canCopy ? () => onTranslate?.(message.id) : undefined,
    onUnsend: () => onUnsend(message.id),
    onUpdateQuickReactions,
    quickReactions,
  };
}
