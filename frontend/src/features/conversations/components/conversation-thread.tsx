import { Calendar, Phone, Search, Video } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode, type UIEvent } from "react";
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
import { Composer } from "@/features/composer";
import {
  gifsFromList,
  slashCommandsFromApi,
  stickerViewsFromPacks,
  type GifView,
  type StickerView,
} from "@/features/composer/model/picker";
import { postReceipts, listMessages, type Message } from "@/features/conversations/api/http";
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
import { MessageInfoSheet } from "@/features/conversations/components/message-info-sheet";
import { ReminderSheet } from "@/features/conversations/components/reminder-sheet";
import { ReportHost } from "@/features/conversations/components/report-host";
import { useConversationChannel } from "@/features/conversations/hooks/use-conversation-channel";
import { useGeneration } from "@/features/conversations/hooks/use-generation";
import { useTypingIndicators } from "@/features/conversations/hooks/use-typing-indicators";
import {
  canRegenerateBotReply,
  generationSenderName,
  type GenerationState,
} from "@/features/conversations/model/generation";
import { conversationById, type DemoMessage } from "@/features/conversations/model/demo";
import { THREAD_LOAD_OLDER_PX } from "@/features/conversations/model/constants";
import { formatThreadDate, sameCalendarDay } from "@/features/conversations/model/dates";
import { newClientNonce, parseConversationId } from "@/features/conversations/model/ids";
import { conversationTitle } from "@/features/conversations/model/title";
import type { ActivityKind } from "@/features/conversations/model/typing";
import { useGifSearch, useStickerPacks } from "@/features/media/api/queries";
import {
  DateDivider,
  MessageContextMenu,
  MessageGroup,
  PollResultsSheet,
  ReactionDetailsSheet,
  SelectionToolbar,
  StreamingBubble,
  TypingBubble,
  groupMessageRuns,
  type MessageMenuActions,
} from "@/features/messages";
import { tickStatus } from "@/features/messages/model/ticks";
import type { GroupableMessage } from "@/features/messages/model/constants";
import { copyText } from "@/features/messages/model/copy-text";
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
import { IconButton } from "@/shared/ui/icon-button";
import { ListView } from "@/shared/ui/list-view";

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
    <div
      className="flex h-full min-h-0 flex-col bg-[var(--surface-chat)]"
      data-conversation-thread=""
    >
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
        title={conversation.name}
      />
      <div
        className="flex min-h-0 flex-1 flex-col gap-[var(--space-4)] overflow-y-auto px-[var(--space-list-x)] py-[var(--space-list-y)]"
        data-layer-scroll={conversationId}
      >
        {received.length > 0 ? (
          <MessageGroup messages={received} senderName={conversation.name} side="received" />
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
  const { cancelGeneration, publishActivity } = useConversationChannel(conversationId);
  const typists = useTypingIndicators(conversationId);
  const generation = useGeneration(conversationId);
  const conversationQuery = useConversation(conversationId);
  const page = useMessagePage(conversationId);
  const send = useSendMessage(conversationId);
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
  const saved = useSavedIds();
  const savedReplies = useSavedReplies();
  const commands = useConversationCommands(conversationId);
  const packs = useStickerPacks();
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
  const mobile = useMobileViewport();
  const [draft, setDraft] = useState("");
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
  const scroller = useRef<HTMLDivElement>(null);
  const stuck = useRef(false);
  const viewerId = getAccessSession()?.accountId ?? 0;
  const listed = page.messages;
  const jumped = jump.data?.messages ?? [];
  const focusId = focusMessageId ? Number(focusMessageId) : null;
  const messages =
    focusId != null && !listed.some((row) => row.id === focusId) && jumped.length > 0
      ? jumped
      : listed;
  const conversation = conversationQuery.data;
  const title = conversation ? conversationTitle(conversation, t("conversations.untitled")) : "";

  useEffect(() => {
    jumpedQuery.current = "";
    resetSearchStore();
  }, [conversationId]);

  useEffect(() => {
    useSearchStore.getState().setMembers(conversation?.members ?? []);
  }, [conversation]);

  useEffect(() => {
    stuck.current = false;
  }, [conversationId, focusMessageId]);

  useEffect(() => {
    const node = scroller.current;
    if (!node || stuck.current || messages.length === 0) {
      return;
    }
    stuck.current = true;
    if (focusMessageId) {
      const target = node.querySelector(`[data-message-id="${focusMessageId}"]`);
      if (target) {
        target.scrollIntoView({ block: "center" });
        return;
      }
    }
    node.scrollTop = node.scrollHeight;
  }, [focusMessageId, messages.length]);

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

  useEffect(() => {
    const first = searchHits[0];
    const jumpKey = `${debouncedSearch}|${serializeFilters(searchFilters)}`;
    if (!chatOpen || searchMode !== "navigate" || !first || jumpedQuery.current === jumpKey) {
      return;
    }
    jumpedQuery.current = jumpKey;
    setMatchIndex(0);
    if (scroller.current) {
      useSearchStore.getState().pushJump({
        conversationId: String(conversationId),
        scrollTop: scroller.current.scrollTop,
      });
    }
    openConversation(conversationLayer(String(conversationId), title, String(first.message_id)));
  }, [
    chatOpen,
    conversationId,
    debouncedSearch,
    openConversation,
    searchFilters,
    searchHits,
    searchMode,
    title,
  ]);

  const onThreadBack = (): void => {
    const restored = useSearchStore.getState().handleBack();
    if (restored && restored !== "closed") {
      openConversation(conversationLayer(String(conversationId), title));
      requestAnimationFrame(() => {
        if (scroller.current) {
          scroller.current.scrollTop = restored.scrollTop;
        }
      });
      return;
    }
    if (restored === "closed") {
      return;
    }
    popLayer();
  };

  const jumpToHit = (messageId: number, index: number): void => {
    setMatchIndex(index);
    if (scroller.current) {
      useSearchStore.getState().pushJump({
        conversationId: String(conversationId),
        scrollTop: scroller.current.scrollTop,
      });
    }
    openConversation(conversationLayer(String(conversationId), title, String(messageId)));
  };

  if (conversationQuery.isPending || page.isPending) {
    return (
      <div
        className="flex h-full min-h-0 flex-col bg-[var(--surface-chat)]"
        data-conversation-thread=""
      >
        <ListView status="loading">{null}</ListView>
      </div>
    );
  }
  if (conversationQuery.isError || page.isError || !conversation) {
    return null;
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-[var(--surface-chat)]"
      data-conversation-thread=""
    >
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
        title={title}
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
            <IconButton aria-label={t("search.open")} onClick={openChatSearch} type="button">
              <Search className="h-[var(--icon-size)] w-[var(--icon-size)]" />
            </IconButton>
            <IconButton
              aria-label={t("search.jump_date")}
              onClick={() => setDateOpen(true)}
              type="button"
            >
              <Calendar className="h-[var(--icon-size)] w-[var(--icon-size)]" />
            </IconButton>
          </>
        )}
      </LayerHeader>
      {chatOpen ? (
        <SearchResultsPanel
          conversationId={conversationId}
          onJump={(hit, index) => jumpToHit(hit.message_id, index)}
        />
      ) : null}
      <JumpDateSheet
        onJump={(iso) => {
          setDateOpen(false);
          if (scroller.current) {
            useSearchStore.getState().pushJump({
              conversationId: String(conversationId),
              scrollTop: scroller.current.scrollTop,
            });
          }
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
      <div
        className="flex min-h-0 flex-1 flex-col gap-[var(--space-4)] overflow-y-auto px-[var(--space-list-x)] py-[var(--space-list-y)]"
        data-layer-scroll={String(conversationId)}
        onScroll={(event: UIEvent<HTMLDivElement>) => {
          const node = event.currentTarget;
          if (
            node.scrollTop > THREAD_LOAD_OLDER_PX ||
            !page.hasNextPage ||
            page.isFetchingNextPage
          ) {
            return;
          }
          void page.fetchNextPage();
        }}
        ref={scroller}
      >
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
        <ThreadMessages
          conversationId={conversationId}
          generation={generation}
          generationName={generationSenderName(
            generation,
            conversation,
            t("conversations.untitled"),
          )}
          locale={i18n.language}
          messages={messages}
          onCancelGeneration={(generationId) => {
            cancelGeneration(generationId);
            cancel.mutate(generationId);
          }}
          onOpenMenu={(id, point) => setMenu({ id, x: point.clientX, y: point.clientY })}
          onOpenPollResults={(id) => setResultsPollId(pollResultsId(messages, id))}
          onVote={(id, optionIds) => voteFromThread(messages, id, optionIds, vote.mutate)}
          translations={translations}
          typists={typists}
          untitled={t("conversations.untitled")}
          viewerId={viewerId}
        />
      </div>
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
      <Composer
        editing={editingId !== null}
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
              onSuccess: (result) => {
                setDraft(result.text);
                setProvisional(true);
                setReplyChips(result.suggested_chips);
              },
            },
          );
        }}
        onSend={({ silent, text }) => {
          if (editingId) {
            edit.mutate({ body: text, id: editingId });
            setEditingId(null);
          } else {
            send.mutate({ body: text, client_nonce: newClientNonce(), silent });
          }
          setDraft("");
          setProvisional(false);
          setReplyChips([]);
        }}
        onGifQueryChange={setGifQuery}
        onPickGif={(gif: GifView) => {
          send.mutate({ client_nonce: newClientNonce(), gif_id: gif.id });
        }}
        onPickSticker={(sticker: StickerView) => {
          send.mutate({ client_nonce: newClientNonce(), sticker_id: Number(sticker.id) });
        }}
        remoteGifs
        gifUnavailable={gifs.isError}
        gifs={gifsFromList(gifs.data?.gifs)}
        savedReplies={savedReplyViews(savedReplies.data?.saved_replies)}
        slashCommands={slashCommandsFromApi(commands.data?.commands)}
        stickers={stickerViewsFromPacks(packs.data?.sticker_packs)}
        provisional={provisional}
        value={draft}
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
            onPin: (id) => pin.mutate(id),
            onReact: (id, emoji) => react.mutate({ emoji, id }),
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
            pinned: pinned.data,
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

function ThreadMessages({
  conversationId,
  generation,
  generationName,
  locale,
  messages,
  onCancelGeneration,
  onOpenMenu,
  onOpenPollResults,
  onVote,
  translations = {},
  typists,
  untitled,
  viewerId,
}: {
  conversationId: number;
  generation: GenerationState | null;
  generationName: string;
  locale: string;
  messages: Message[];
  onCancelGeneration: (generationId: string) => void;
  onOpenMenu: (id: number, point: { clientX: number; clientY: number }) => void;
  onOpenPollResults: (id: number) => void;
  onVote: (id: number, optionIds: string[]) => void;
  translations?: Record<number, string>;
  typists: Array<{ accountId: number; activity: ActivityKind; displayName: string }>;
  untitled: string;
  viewerId: number;
}): ReactNode {
  const { t } = useTranslation();
  const pushLayer = useLayerStore((state) => state.pushLayer);
  const deleted = t("messages.deleted");
  const runs = useMemo(() => {
    const groupable: Array<GroupableMessage & { message: Message }> = messages.map((message) => ({
      createdAt: Date.parse(message.created_at),
      id: String(message.id),
      message,
      senderId:
        message.kind === "system"
          ? `system:${String(message.id)}`
          : String(message.sender?.id ?? 0),
    }));
    return groupMessageRuns(groupable).map((run) => ({
      ...run,
      messages: run.messages as Array<GroupableMessage & { message: Message }>,
    }));
  }, [messages]);

  return (
    <>
      {runs.map((run, index) => {
        const first = run.messages[0]!.message;
        const previous = runs[index - 1]?.messages[0]?.message;
        const divider =
          !previous || !sameCalendarDay(previous.created_at, first.created_at) ? (
            <DateDivider label={formatThreadDate(first.created_at, locale)} />
          ) : null;
        if (first.kind === "system") {
          return (
            <div key={first.id}>
              {divider}
              {run.messages.map((item) => (
                <p
                  className="px-[var(--space-4)] py-[var(--space-3)] text-center text-[length:var(--text-sm)] text-[var(--text-tertiary)]"
                  data-message-id={item.id}
                  data-system-message={item.message.system_event ?? ""}
                  key={item.id}
                >
                  {item.message.body}
                </p>
              ))}
            </div>
          );
        }
        const side = first.sender?.id === viewerId ? "sent" : "received";
        return (
          <div key={first.id}>
            {divider}
            <MessageGroup
              messages={run.messages.map((item) => ({
                attachments: item.message.attachments,
                body: item.message.deleted ? deleted : (item.message.body ?? ""),
                contacts: (item.message.contacts ?? []).map(contactViewFromApi),
                createdAt: item.message.created_at,
                id: item.id,
                location: item.message.location
                  ? locationViewFromApi(item.message.location)
                  : undefined,
                poll: item.message.poll ? pollViewFromApi(item.message.poll) : undefined,
                status: tickStatus(item.message),
                translation: translations[item.message.id],
              }))}
              onOpenContactProfile={(accountId, name) =>
                pushLayer({
                  accountId,
                  conversationId: String(conversationId),
                  id: `account:${accountId}`,
                  kind: "profile",
                  title: name,
                })
              }
              onOpenMenu={bindNumericId(onOpenMenu)}
              onOpenPollResults={bindNumericId(onOpenPollResults)}
              onVote={bindNumericId(onVote)}
              senderName={first.sender?.display_name ?? untitled}
              side={side}
            />
          </div>
        );
      })}
      {typists.map((typist) => (
        <TypingBubble
          activity={typist.activity}
          key={typist.accountId}
          senderName={typist.displayName}
        />
      ))}
      {generation ? (
        <StreamingBubble
          onCancel={() => onCancelGeneration(generation.generationId)}
          senderName={generationName}
          text={generation.text}
        />
      ) : null}
    </>
  );
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
  pinned,
  restrictForwarding = false,
  saved,
  viewerId,
  onSuggestReply,
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
  onTranslate?: (id: number) => void;
  onUnsend: (id: number) => void;
  pinned: number[];
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
    onTranslate: Boolean(onTranslate) && canCopy ? () => onTranslate?.(message.id) : undefined,
    onUnsend: () => onUnsend(message.id),
  };
}
