import type { components } from "@/shared/lib/api/schema";
import { DEV_ACCOUNT_B_ID, DEV_ACCOUNT_B_USERNAME } from "@/features/auth/model/dev-accounts";
import { DEMO_CONVERSATIONS } from "@/features/conversations/model/demo";
import { conversationPermissionDefaults } from "@/features/conversations/model/permissions";
import {
  JUMP_HALF_WINDOW,
  JUMP_WINDOW,
  MESSAGE_PAGE_SIZE,
} from "@/features/conversations/model/settings";
import {
  SEARCH_FIXTURE_NEEDLE,
  SEARCH_THREAD_FILLER_COUNT,
} from "@/features/search/model/constants";

type Account = components["schemas"]["Account"];
type Conversation = components["schemas"]["Conversation"];
type ConversationFolder = components["schemas"]["ConversationFolder"];
type GroupInvite = components["schemas"]["GroupInvite"];
type JoinRequestItem = components["schemas"]["JoinRequestItem"];
type Message = components["schemas"]["Message"];
type MessagePage = components["schemas"]["MessagePage"];
type MessageInfo = components["schemas"]["MessageInfo"];

export const VIEWER: Account = {
  id: 1,
  username: "ada",
  display_name: "Ada",
  kind: "human",
};

export const DIRECTORY_HUMANS: Account[] = [
  VIEWER,
  {
    id: DEV_ACCOUNT_B_ID,
    username: DEV_ACCOUNT_B_USERNAME,
    display_name: "Grace",
    kind: "human",
  },
];

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
      avatar_url: null,
      member_count: group ? 3 : 2,
      last_activity_at: MESSAGE_STAMP,
      unread_count: demo.unreadCount,
      muted_until: null,
      archived_at: null,
      role: group ? "owner" : "member",
      ...conversationPermissionDefaults(),
      peer: group ? undefined : peerAccount(id + 1, demo.name),
      last_message: preview(last.text, last.kind === "system" ? "system" : "text"),
      members: [
        { account: VIEWER, role: "member" },
        ...(group ? [] : [{ account: peerAccount(id + 1, demo.name), role: "member" as const }]),
      ],
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
  const items =
    demo.name === "Adele Goldberg"
      ? [
          { body: `${SEARCH_FIXTURE_NEEDLE} unique`, id: "search-old", side: "received" as const },
          ...Array.from({ length: SEARCH_THREAD_FILLER_COUNT }, (_, index) => ({
            body: `Ping ${String(index)}`,
            id: `search-fill-${String(index)}`,
            side: "received" as const,
          })),
        ]
      : demo.messages;
  return items.map((item, index) => {
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
  pins: Record<number, number[]>;
}

export function createMessagingStore(): MessagingStore {
  const conversations = buildConversations();
  const messages: Record<number, Message[]> = {};
  conversations.forEach((conversation, index) => {
    messages[conversation.id] = buildMessages(conversation.id, index);
  });
  return { conversations, messages, nextId: 10_000, pins: {} };
}

let store = createMessagingStore();

export interface InviteStore {
  invites: GroupInvite[];
  nextInviteId: number;
  pendingTokens: Set<string>;
  requests: JoinRequestItem[];
}

export interface FolderStore {
  folders: ConversationFolder[];
  nextId: number;
}

function createFolderStore(): FolderStore {
  return {
    folders: [{ id: 1, name: "Work", position: 0, conversation_ids: [2] }],
    nextId: 2,
  };
}

function createInviteStore(): InviteStore {
  return {
    invites: [
      {
        created_at: MESSAGE_STAMP,
        expires_at: null,
        id: 1,
        max_uses: 10,
        requires_approval: true,
        token: "lim",
        usable: true,
        uses_count: 2,
      },
      {
        created_at: MESSAGE_STAMP,
        expires_at: null,
        id: 2,
        max_uses: null,
        requires_approval: false,
        token: "unlim",
        usable: true,
        uses_count: 0,
      },
    ],
    nextInviteId: 3,
    pendingTokens: new Set<string>(),
    requests: [
      {
        account: peerAccount(9, "Joiner"),
        created_at: MESSAGE_STAMP,
        id: 1,
        status: "pending",
      },
    ],
  };
}

let inviteStore = createInviteStore();
let folderStore = createFolderStore();

export function resetMessagingStore(): void {
  store = createMessagingStore();
  inviteStore = createInviteStore();
  folderStore = createFolderStore();
}

export function inviteRecords(): InviteStore {
  return inviteStore;
}

export function folderRecords(): FolderStore {
  return folderStore;
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
  query: {
    after?: number;
    after_revision?: number;
    around_at?: string;
    around_id?: number;
    before?: number;
  } = {},
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

export function messageSearchHits(
  query: string,
  conversationId?: number,
  filters: {
    createdAfter?: string | null;
    createdBefore?: string | null;
    hasAttachment?: boolean | null;
    hasLink?: boolean | null;
    kind?: string | null;
    senderAccountId?: number | null;
  } = {},
) {
  const needle = query.trim().toLowerCase();
  const filteredOnly =
    Boolean(filters.kind) ||
    Boolean(filters.createdAfter) ||
    Boolean(filters.createdBefore) ||
    filters.hasAttachment === true ||
    filters.hasLink === true ||
    filters.senderAccountId != null;
  if (needle.length < 2 && !filteredOnly) {
    return [];
  }
  const rows =
    conversationId != null
      ? (store.messages[conversationId] ?? [])
      : Object.values(store.messages).flat();
  const matched = rows.filter((row) => {
    if (row.deleted) {
      return false;
    }
    if (needle.length >= 2 && (row.body == null || !row.body.toLowerCase().includes(needle))) {
      return false;
    }
    if (filters.kind && row.kind !== filters.kind) {
      return false;
    }
    if (filters.senderAccountId != null && row.sender?.id !== filters.senderAccountId) {
      return false;
    }
    if (filters.createdAfter && row.created_at < filters.createdAfter) {
      return false;
    }
    if (filters.createdBefore && row.created_at > filters.createdBefore) {
      return false;
    }
    if (filters.hasAttachment === true && (row.attachment_count ?? 0) < 1) {
      return false;
    }
    if (filters.hasLink === true && !/https?:\/\//i.test(row.body ?? "")) {
      return false;
    }
    return true;
  });
  const unique =
    conversationId != null
      ? matched
      : [...new Map(matched.map((row) => [row.conversation_id, row])).values()];
  return unique.map((row) => ({
    can_forward: true,
    conversation_id: row.conversation_id,
    created_at: row.created_at,
    message_id: row.id,
    sender_name: row.sender?.display_name ?? null,
    snippet: row.body as string,
  }));
}

export function searchFiltersFromRequest(url: string) {
  const params = new URL(url).searchParams;
  const sender = params.get("sender_account_id");
  return {
    createdAfter: params.get("created_after"),
    createdBefore: params.get("created_before"),
    hasAttachment: params.has("has_attachment") ? params.get("has_attachment") === "true" : null,
    hasLink: params.has("has_link") ? params.get("has_link") === "true" : null,
    kind: params.get("kind"),
    senderAccountId: sender ? Number(sender) : null,
  };
}

export function conversationHitTitle(row: Conversation): string {
  return row.title ?? row.peer?.display_name ?? "";
}

function accountMatchesNeedle(account: Account, needle: string): boolean {
  return (
    account.display_name.toLowerCase().includes(needle) ||
    account.username.toLowerCase().includes(needle)
  );
}

export function accountSearchHits(query: string, actorId = VIEWER.id) {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) {
    return [];
  }
  const seen = new Set<number>();
  const hits: Account[] = [];
  for (const account of [...DIRECTORY_HUMANS, ...store.conversations.map((row) => row.peer)]) {
    if (!account || account.id === actorId || seen.has(account.id)) {
      continue;
    }
    if (!accountMatchesNeedle(account, needle)) {
      continue;
    }
    seen.add(account.id);
    hits.push(account);
  }
  return hits;
}

export function findDirectWithPeer(accountId: number) {
  return store.conversations.find(
    (row) =>
      row.kind === "direct" &&
      (row.peer?.id === accountId ||
        row.members?.some((member) => member.account.id === accountId)),
  );
}

function nextConversationId(): number {
  return Math.max(0, ...store.conversations.map((row) => row.id)) + 1;
}

function applyConversationUpsert(conversation: Conversation): void {
  const index = store.conversations.findIndex((row) => row.id === conversation.id);
  if (index >= 0) {
    store.conversations[index] = conversation;
    return;
  }
  store.conversations.unshift(conversation);
  if (!store.messages[conversation.id]) {
    store.messages[conversation.id] = [];
  }
}

export function upsertConversation(conversation: Conversation): Conversation {
  applyConversationUpsert(conversation);
  publishMswStore({ type: "upsert_conversation", conversation });
  return conversation;
}

export function createDirectConversation(
  actorId: number,
  peerId: number,
  peerOverride?: Account,
): Conversation {
  const selfChat = actorId === peerId;
  const existing = selfChat
    ? store.conversations.find(
        (row) => row.kind === "direct" && row.member_count === 1 && row.peer?.id === actorId,
      )
    : findDirectWithPeer(peerId);
  if (existing) {
    return existing;
  }
  const actor = DIRECTORY_HUMANS.find((row) => row.id === actorId) ?? VIEWER;
  const peer =
    peerOverride ??
    DIRECTORY_HUMANS.find((row) => row.id === peerId) ??
    peerAccount(peerId, `User ${String(peerId)}`);
  return upsertConversation({
    id: nextConversationId(),
    kind: "direct",
    title: null,
    description: null,
    avatar_url: null,
    member_count: selfChat ? 1 : 2,
    last_activity_at: MESSAGE_STAMP,
    unread_count: 0,
    muted_until: null,
    archived_at: null,
    role: "member",
    ...conversationPermissionDefaults(),
    peer,
    members: selfChat
      ? [{ account: actor, role: "member" }]
      : [
          { account: actor, role: "member" },
          { account: peer, role: "member" },
        ],
    pinned_at: null,
    manually_unread_at: null,
  });
}

export function conversationSearchHits(query: string) {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) {
    return [];
  }
  return store.conversations
    .filter((row) => conversationHitTitle(row).toLowerCase().includes(needle))
    .map((row) => ({
      id: row.id,
      kind: row.kind,
      title: conversationHitTitle(row),
    }));
}

export function appendSent(
  conversationId: number,
  body: string,
  nonce?: string,
  silent = false,
  voice?: { durationMs: number; waveform: number[] },
  attachmentSignedIds: string[] = [],
): Message {
  const rows = store.messages[conversationId] ?? [];
  if (nonce) {
    const existing = rows.find((row) => row.client_nonce === nonce);
    if (existing) {
      return existing;
    }
  }
  const last = rows[rows.length - 1];
  const created = new Date().toISOString();
  const isVoice = voice != null;
  const hasImage = !isVoice && attachmentSignedIds.length > 0;
  const message: Message = {
    id: store.nextId,
    conversation_id: conversationId,
    position: (last?.position ?? 0) + 1,
    revision: 1,
    kind: isVoice ? "voice" : hasImage ? "image" : "text",
    body: isVoice ? null : body,
    deleted: false,
    silent,
    client_nonce: nonce ?? null,
    created_at: created,
    sender: VIEWER,
    tick: "sent",
    attachment_count: isVoice || hasImage ? 1 : undefined,
    attachments: isVoice
      ? [
          {
            id: store.nextId + 1000,
            kind: "voice",
            content_type: "audio/webm",
            byte_size: 1,
            duration_ms: voice.durationMs,
            waveform: voice.waveform,
            processing_status: "ready",
            filename: "voice.weba",
          },
        ]
      : hasImage
        ? [
            {
              byte_size: 1,
              content_type: "image/png",
              filename: "upload.png",
              id: store.nextId + 1000,
              kind: "image",
              processing_status: "pending",
            },
          ]
        : undefined,
  };
  store.nextId += 1;
  store.messages[conversationId] = [...rows, message];
  const conversation = findConversation(conversationId);
  if (conversation) {
    conversation.last_activity_at = created;
    conversation.last_message = {
      id: message.id,
      kind: isVoice ? "voice" : "text",
      body: isVoice ? null : body,
      deleted: false,
      created_at: created,
      sender_name: VIEWER.display_name,
    };
  }
  publishMswStore({ type: "append", message });
  return message;
}

export function completeAttachmentProcessing(messageId: number): Message | null {
  return replaceMessage(messageId, (message) => ({
    ...message,
    attachments: message.attachments?.map((attachment) => ({
      ...attachment,
      height: attachment.kind === "image" ? 9 : attachment.height,
      processing_error: null,
      processing_status: "ready",
      width: attachment.kind === "image" ? 16 : attachment.width,
    })),
  }));
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

export function reactStoredMessage(id: number, emoji = "👍", add = true): Message | null {
  return replaceMessage(id, (message) => {
    const count = Math.max(0, (message.reaction_summary?.[emoji] ?? 0) + (add ? 1 : -1));
    return {
      ...message,
      my_reactions: add
        ? [...new Set([...(message.my_reactions ?? []), emoji])]
        : (message.my_reactions ?? []).filter((value) => value !== emoji),
      reaction_summary: { ...message.reaction_summary, [emoji]: count },
      revision: message.revision + 1,
    };
  });
}

export function pinnedMessageIds(conversationId: number): number[] {
  return store.pins[conversationId] ?? [];
}

export function pinStoredMessage(conversationId: number, messageId: number): void {
  store.pins[conversationId] = [...new Set([...(store.pins[conversationId] ?? []), messageId])];
}

export function unpinStoredMessage(conversationId: number, messageId: number): void {
  store.pins[conversationId] = (store.pins[conversationId] ?? []).filter((id) => id !== messageId);
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

const STORE_CHANNEL = "rajya:msw-store";

type StoreSync =
  | { type: "append"; message: Message }
  | { type: "ticks"; actorId: number; conversationId: number; tick: "delivered" | "read" }
  | { type: "upsert_conversation"; conversation: Conversation };

function syncEnabled(): boolean {
  return import.meta.env.VITE_MSW === "1" && typeof BroadcastChannel !== "undefined";
}

function publishMswStore(event: StoreSync): void {
  if (!syncEnabled()) {
    return;
  }
  const channel = new BroadcastChannel(STORE_CHANNEL);
  channel.postMessage(event);
  channel.close();
}

export function ingestRemoteMessage(message: Message): void {
  const rows = store.messages[message.conversation_id] ?? [];
  if (
    rows.some(
      (row) =>
        row.id === message.id ||
        (message.client_nonce && row.client_nonce === message.client_nonce),
    )
  ) {
    return;
  }
  store.messages[message.conversation_id] = [...rows, message];
  store.nextId = Math.max(store.nextId, message.id + 1);
  const conversation = findConversation(message.conversation_id);
  if (conversation) {
    conversation.last_activity_at = message.created_at;
    conversation.last_message = {
      id: message.id,
      kind: message.kind,
      body: message.body ?? null,
      deleted: message.deleted,
      created_at: message.created_at,
      sender_name: message.sender?.display_name,
    };
  }
}

export function listenForMswStoreSync(): () => void {
  if (!syncEnabled()) {
    return () => undefined;
  }
  const channel = new BroadcastChannel(STORE_CHANNEL);
  channel.onmessage = (event: MessageEvent<StoreSync>) => {
    const payload = event.data;
    if (payload.type === "append") {
      ingestRemoteMessage(payload.message);
      return;
    }
    if (payload.type === "upsert_conversation") {
      applyConversationUpsert(payload.conversation);
      return;
    }
    if (payload.type === "ticks") {
      applyTicks(payload.conversationId, payload.tick, payload.actorId);
    }
  };
  return () => channel.close();
}

export function setConversationTicks(
  conversationId: number,
  tick: "delivered" | "read",
  actorId = VIEWER.id,
): void {
  applyTicks(conversationId, tick, actorId);
  publishMswStore({ type: "ticks", actorId, conversationId, tick });
}

function applyTicks(conversationId: number, tick: "delivered" | "read", actorId: number): void {
  if (actorId === VIEWER.id) {
    return;
  }
  const rows = store.messages[conversationId];
  if (!rows) {
    return;
  }
  store.messages[conversationId] = rows.map((message) =>
    message.sender?.id === VIEWER.id && message.id > 0 ? { ...message, tick } : message,
  );
}

export function appendSystemEvent(
  conversationId: number,
  systemEvent: string,
  body: string,
): Message {
  const rows = store.messages[conversationId] ?? [];
  const last = rows[rows.length - 1];
  const created = new Date().toISOString();
  const message: Message = {
    id: store.nextId,
    conversation_id: conversationId,
    position: (last?.position ?? 0) + 1,
    revision: 1,
    kind: "system",
    system_event: systemEvent,
    body,
    deleted: false,
    silent: false,
    created_at: created,
  };
  store.nextId += 1;
  store.messages[conversationId] = [...rows, message];
  const conversation = findConversation(conversationId);
  if (conversation) {
    conversation.last_activity_at = created;
    conversation.last_message = {
      id: message.id,
      kind: "system",
      body,
      deleted: false,
      created_at: created,
    };
  }
  publishMswStore({ type: "append", message });
  return message;
}

listenForMswStoreSync();
