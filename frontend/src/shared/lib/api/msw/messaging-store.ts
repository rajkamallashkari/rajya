import type { components } from "@/shared/lib/api/schema";
import { DEMO_CONVERSATIONS } from "@/features/conversations/model/demo";
import {
  JUMP_HALF_WINDOW,
  JUMP_WINDOW,
  MESSAGE_PAGE_SIZE,
} from "@/features/conversations/model/settings";

type Account = components["schemas"]["Account"];
type Conversation = components["schemas"]["Conversation"];
type Message = components["schemas"]["Message"];
type MessagePage = components["schemas"]["MessagePage"];
type MessageInfo = components["schemas"]["MessageInfo"];

export const VIEWER: Account = {
  id: 1,
  username: "ada",
  display_name: "Ada",
  kind: "human",
};

export const MESSAGE_STAMP = "2026-01-01T12:00:00.000Z";

export function peerAccount(id: number, name: string): Account {
  return { id, username: `user${String(id)}`, display_name: name, kind: "human" };
}

function preview(body: string, kind = "text"): components["schemas"]["MessagePreview"] {
  return {
    id: 1,
    kind,
    body,
    deleted: false,
    created_at: MESSAGE_STAMP,
    sender_name: VIEWER.display_name,
  };
}

export function buildConversations(): Conversation[] {
  return DEMO_CONVERSATIONS.map((demo, index) => {
    const id = index + 1;
    const group = demo.id === "team" || demo.id === "notes";
    const last = demo.lastActivity;
    return {
      id,
      kind: group ? "group" : "direct",
      title: group ? demo.name : null,
      description: null,
      last_activity_at: MESSAGE_STAMP,
      unread_count: demo.unreadCount,
      muted_until: null,
      role: group ? "owner" : "member",
      peer: group ? undefined : peerAccount(id + 1, demo.name),
      last_message: preview(last.text, last.kind === "system" ? "system" : "text"),
      members: [],
      pinned_at: null,
      manually_unread_at: null,
    };
  });
}

export function buildMessages(conversationId: number, demoIndex: number): Message[] {
  const demo = DEMO_CONVERSATIONS[demoIndex];
  if (!demo) {
    return [];
  }
  return demo.messages.map((item, index) => {
    const sent = item.side === "sent";
    return {
      id: conversationId * 100 + index + 1,
      conversation_id: conversationId,
      position: index + 1,
      revision: 1,
      kind: "text",
      body: item.body,
      deleted: false,
      silent: false,
      created_at: MESSAGE_STAMP,
      sender: sent ? VIEWER : peerAccount(conversationId + 1, demo.name),
    };
  });
}

export interface MessagingStore {
  conversations: Conversation[];
  messages: Record<number, Message[]>;
  nextId: number;
}

export function createMessagingStore(): MessagingStore {
  const conversations = buildConversations();
  const messages: Record<number, Message[]> = {};
  conversations.forEach((conversation, index) => {
    messages[conversation.id] = buildMessages(conversation.id, index);
  });
  return { conversations, messages, nextId: 10_000 };
}

let store = createMessagingStore();

export function resetMessagingStore(): void {
  store = createMessagingStore();
}

export function messagingStore(): MessagingStore {
  return store;
}

export function findConversation(id: number): Conversation | undefined {
  return store.conversations.find((row) => row.id === id);
}

export function findMessage(id: number): Message | undefined {
  for (const rows of Object.values(store.messages)) {
    const found = rows.find((row) => row.id === id);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function emptyPage(): MessagePage {
  return {
    messages: [],
    meta: {
      has_more_before: false,
      has_more_after: false,
      oldest_position: null,
      newest_position: null,
      pivot_id: null,
    },
  };
}

function wrapPage(sliced: Message[], all: Message[], pivotId: number | null = null): MessagePage {
  const oldest = sliced[0]?.position ?? null;
  const newest = sliced[sliced.length - 1]?.position ?? null;
  return {
    messages: sliced,
    meta: {
      has_more_before: oldest != null && all.some((row) => row.position < oldest),
      has_more_after: newest != null && all.some((row) => row.position > newest),
      oldest_position: oldest,
      newest_position: newest,
      pivot_id: pivotId,
    },
  };
}

function windowAround(rows: Message[], pivot: Message): MessagePage {
  const index = rows.indexOf(pivot);
  const start = Math.max(0, index - JUMP_HALF_WINDOW);
  return wrapPage(rows.slice(start, start + JUMP_WINDOW), rows, pivot.id);
}

export function pageFor(
  conversationId: number,
  query: { after?: number; after_revision?: number; around_at?: string; around_id?: number; before?: number } = {},
): MessagePage | null {
  const rows = [...(store.messages[conversationId] ?? [])].sort((a, b) => a.position - b.position);
  if (query.around_id != null) {
    const pivot = rows.find((row) => row.id === query.around_id);
    if (!pivot) {
      return null;
    }
    return windowAround(rows, pivot);
  }
  if (query.around_at != null) {
    const at = Date.parse(query.around_at);
    const pivot =
      [...rows].reverse().find((row) => Date.parse(row.created_at) <= at) ?? rows[rows.length - 1];
    if (!pivot) {
      return emptyPage();
    }
    return windowAround(rows, pivot);
  }
  if (query.after_revision != null) {
    const afterRevision = query.after_revision;
    return wrapPage(
      rows.filter((row) => row.revision > afterRevision),
      rows,
    );
  }
  if (query.after != null) {
    const after = query.after;
    return wrapPage(rows.filter((row) => row.position > after).slice(0, MESSAGE_PAGE_SIZE), rows);
  }
  if (query.before != null) {
    const before = query.before;
    const older = rows.filter((row) => row.position < before);
    return wrapPage(older.slice(Math.max(0, older.length - MESSAGE_PAGE_SIZE)), rows);
  }
  return wrapPage(rows.slice(Math.max(0, rows.length - MESSAGE_PAGE_SIZE)), rows);
}

export function appendSent(
  conversationId: number,
  body: string,
  nonce?: string,
  silent = false,
): Message {
  const rows = store.messages[conversationId] ?? [];
  const last = rows[rows.length - 1];
  const created = new Date().toISOString();
  const message: Message = {
    id: store.nextId,
    conversation_id: conversationId,
    position: (last?.position ?? 0) + 1,
    revision: 1,
    kind: "text",
    body,
    deleted: false,
    silent,
    client_nonce: nonce ?? null,
    created_at: created,
    sender: VIEWER,
  };
  store.nextId += 1;
  store.messages[conversationId] = [...rows, message];
  const conversation = findConversation(conversationId);
  if (conversation) {
    conversation.last_activity_at = created;
    conversation.last_message = {
      id: message.id,
      kind: "text",
      body,
      deleted: false,
      created_at: created,
      sender_name: VIEWER.display_name,
    };
  }
  return message;
}

function replaceMessage(id: number, mapper: (message: Message) => Message): Message | null {
  for (const [conversationId, rows] of Object.entries(store.messages)) {
    const current = rows.find((row) => row.id === id);
    if (!current) {
      continue;
    }
    const next = mapper(current);
    store.messages[Number(conversationId)] = rows.map((row) => (row.id === id ? next : row));
    return next;
  }
  return null;
}

export function patchMessage(id: number, body: string): Message | null {
  return replaceMessage(id, (message) => ({
    ...message,
    body,
    edited_at: new Date().toISOString(),
    revision: message.revision + 1,
  }));
}

export function tombstoneMessage(id: number): Message | null {
  return replaceMessage(id, (message) => ({
    ...message,
    body: null,
    deleted: true,
    revision: message.revision + 1,
  }));
}

export function reactStoredMessage(id: number): Message | null {
  return replaceMessage(id, (message) => ({
    ...message,
    revision: message.revision + 1,
    reaction_summary: { ...message.reaction_summary, "👍": 1 },
  }));
}

export function voteStoredPoll(pollId: number, optionIds: number[]): Message | null {
  const selected = new Set(optionIds);
  for (const rows of Object.values(store.messages)) {
    const current = rows.find((row) => row.poll?.id === pollId);
    if (!current?.poll) {
      continue;
    }
    const poll = current.poll;
    return replaceMessage(current.id, (message) => ({
      ...message,
      poll: {
        ...poll,
        options: poll.options.map((option) => ({
          ...option,
          selected: selected.has(option.id),
        })),
      },
    }));
  }
  return null;
}

export function closeStoredPoll(pollId: number): Message | null {
  for (const rows of Object.values(store.messages)) {
    const current = rows.find((row) => row.poll?.id === pollId);
    if (!current?.poll) {
      continue;
    }
    const poll = current.poll;
    return replaceMessage(current.id, (message) => ({
      ...message,
      poll: { ...poll, closed: true },
    }));
  }
  return null;
}

export function attachPoll(messageId: number, poll: NonNullable<Message["poll"]>): Message | null {
  return replaceMessage(messageId, (message) => ({ ...message, poll }));
}

export function findPoll(pollId: number): NonNullable<Message["poll"]> | undefined {
  return findMessageByPoll(pollId)?.poll;
}

function findMessageByPoll(pollId: number): Message | undefined {
  for (const rows of Object.values(store.messages)) {
    const found = rows.find((row) => row.poll?.id === pollId);
    if (found) {
      return found;
    }
  }
  return undefined;
}

export function seedPositions(conversationId: number, count: number): void {
  const rows: Message[] = [];
  for (let position = 1; position <= count; position += 1) {
    rows.push({
      id: position,
      conversation_id: conversationId,
      position,
      revision: 1,
      kind: position === 1 ? "system" : "text",
      body: `m${String(position)}`,
      deleted: false,
      silent: false,
      created_at: MESSAGE_STAMP,
      sender: position % 2 === 0 ? VIEWER : peerAccount(2, "Peer"),
    });
  }
  store.messages[conversationId] = rows;
}

export function infoFor(id: number): MessageInfo | null {
  const message = findMessage(id);
  if (!message) {
    return null;
  }
  if (message.sender?.id === VIEWER.id) {
    return {
      delivered: [{ account: peerAccount(2, "Peer"), at: MESSAGE_STAMP }],
      read: [{ account: peerAccount(2, "Peer"), at: MESSAGE_STAMP }],
    };
  }
  return { delivered: [], read: [] };
}

export const emptyInfo: MessageInfo = { delivered: [], read: [] };
