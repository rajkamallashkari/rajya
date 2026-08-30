import { useEffect, useMemo, useRef, useState, type ReactNode, type UIEvent } from "react";
import { useTranslation } from "react-i18next";
import { getAccessSession } from "@/features/auth/model/access-session";
import { Composer } from "@/features/composer";
import type { Message } from "@/features/conversations/api/http";
import {
  useBulkForward,
  useBulkSave,
  useBulkUnsend,
  useConversation,
  useEditMessage,
  useJumpToMessage,
  useMessageInfo,
  useMessagePage,
  usePinMessage,
  usePinnedIds,
  usePollResults,
  useReactMessage,
  useReactionDetails,
  useSaveMessage,
  useSavedIds,
  useSendMessage,
  useUnsendMessage,
  useVotePoll,
} from "@/features/conversations/api/queries";
import { MessageInfoSheet } from "@/features/conversations/components/message-info-sheet";
import { conversationById, type DemoMessage } from "@/features/conversations/model/demo";
import { THREAD_LOAD_OLDER_PX } from "@/features/conversations/model/constants";
import { formatThreadDate, sameCalendarDay } from "@/features/conversations/model/dates";
import { newClientNonce, parseConversationId } from "@/features/conversations/model/ids";
import { conversationTitle } from "@/features/conversations/model/title";
import {
  DateDivider,
  MessageContextMenu,
  MessageGroup,
  PollResultsSheet,
  ReactionDetailsSheet,
  SelectionToolbar,
  groupMessageRuns,
  type MessageMenuActions,
} from "@/features/messages";
import { copyText } from "@/features/messages/model/copy-text";
import {
  contactViewFromApi,
  locationViewFromApi,
  pollViewFromApi,
} from "@/features/messages/model/poll";
import type { GroupableMessage } from "@/features/messages/model/constants";
import { LayerHeader } from "@/app/navigation/layer-header";
import { useMobileViewport } from "@/shared/hooks/use-mobile-viewport";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";
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
  const conversationQuery = useConversation(conversationId);
  const page = useMessagePage(conversationId);
  const send = useSendMessage(conversationId);
  const edit = useEditMessage(conversationId);
  const react = useReactMessage(conversationId);
  const pin = usePinMessage(conversationId);
  const save = useSaveMessage();
  const unsend = useUnsendMessage(conversationId);
  const bulkUnsend = useBulkUnsend(conversationId);
  const bulkSave = useBulkSave();
  const bulkForward = useBulkForward(conversationId);
  const vote = useVotePoll(conversationId);
  const pinned = usePinnedIds(conversationId);
  const saved = useSavedIds();
  const [infoId, setInfoId] = useState<number | null>(null);
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
  const mobile = useMobileViewport();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [menu, setMenu] = useState<{
    id: number;
    x: number;
    y: number;
  } | null>(null);
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
        <ThreadMessages
          locale={i18n.language}
          messages={messages}
          onOpenMenu={(id, point) => setMenu({ id, x: point.clientX, y: point.clientY })}
          onOpenPollResults={(id) => setResultsPollId(pollResultsId(messages, id))}
          onVote={(id, optionIds) => voteFromThread(messages, id, optionIds, vote.mutate)}
          untitled={t("conversations.untitled")}
          viewerId={viewerId}
        />
      </div>
      <Composer
        editing={editingId !== null}
        onChange={setDraft}
        onDismissEdit={() => {
          setEditingId(null);
          setDraft("");
        }}
        onEditLast={() => {
          if (!lastSent?.body) {
            return;
          }
          setEditingId(lastSent.id);
          setDraft(lastSent.body);
        }}
        onSend={({ silent, text }) => {
          if (editingId) {
            edit.mutate({ body: text, id: editingId });
            setEditingId(null);
          } else {
            send.mutate({ body: text, client_nonce: newClientNonce(), silent });
          }
          setDraft("");
        }}
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
            onSave: (id) => save.mutate(id),
            onSelect: (id) => setSelectedIds((current) => (current.includes(id) ? current : [...current, id])),
            onUnsend: (id) => unsend.mutate(id),
            pinned: pinned.data,
            saved: saved.data,
            viewerId,
          })}
          onClose={() => setMenu(null)}
          x={menu.x}
          y={menu.y}
        />
      ) : null}
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
        reactions={(reactions.data?.reactions ?? []).map((row) => ({
          accountId: String(row.account.id),
          emoji: row.emoji,
          name: row.account.display_name,
        }))}
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
  locale,
  messages,
  onOpenMenu,
  onOpenPollResults,
  onVote,
  untitled,
  viewerId,
}: {
  locale: string;
  messages: Message[];
  onOpenMenu: (id: number, point: { clientX: number; clientY: number }) => void;
  onOpenPollResults: (id: number) => void;
  onVote: (id: number, optionIds: string[]) => void;
  untitled: string;
  viewerId: number;
}): ReactNode {
  const { t } = useTranslation();
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
                  data-system-message=""
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
                body: item.message.deleted ? deleted : (item.message.body ?? ""),
                contacts: (item.message.contacts ?? []).map(contactViewFromApi),
                createdAt: item.message.created_at,
                id: item.id,
                location: item.message.location
                  ? locationViewFromApi(item.message.location)
                  : undefined,
                poll: item.message.poll ? pollViewFromApi(item.message.poll) : undefined,
                status: item.message.id < 0 ? "queued" : undefined,
              }))}
              onOpenMenu={(id, point) => onOpenMenu(Number(id), point)}
              onOpenPollResults={(id) => onOpenPollResults(Number(id))}
              onVote={(id, optionIds) => onVote(Number(id), optionIds)}
              senderName={first.sender?.display_name ?? untitled}
              side={side}
            />
          </div>
        );
      })}
    </>
  );
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
  onSave,
  onSelect,
  onUnsend,
  pinned,
  saved,
  viewerId,
}: {
  message: Message | undefined;
  onCopy: (body: string) => void;
  onEdit: (id: number, body: string) => void;
  onInfo: (id: number) => void;
  onPin: (id: number) => void;
  onReact: (id: number, emoji: string) => void;
  onReactions: (id: number) => void;
  onSave: (id: number) => void;
  onSelect: (id: number) => void;
  onUnsend: (id: number) => void;
  pinned: number[];
  saved: number[];
  viewerId: number;
}): MessageMenuActions {
  if (!message) {
    return {};
  }
  const isMine = message.sender?.id === viewerId;
  return {
    canEdit: isMine && !message.deleted && Boolean(message.body),
    hasText: Boolean(message.body),
    isMine,
    isPinned: pinned.includes(message.id),
    isSaved: saved.includes(message.id),
    onCopy: message.body ? () => onCopy(message.body as string) : undefined,
    onEdit: message.body ? () => onEdit(message.id, message.body as string) : undefined,
    onInfo: () => onInfo(message.id),
    onPin: () => onPin(message.id),
    onReact: (emoji) => onReact(message.id, emoji),
    onReactions: () => onReactions(message.id),
    onSave: () => onSave(message.id),
    onSelect: () => onSelect(message.id),
    onUnsend: () => onUnsend(message.id),
  };
}
