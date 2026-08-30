import { CLIENT_CACHE_SIZE } from "@/features/conversations/model/settings";
import type { Conversation, Message } from "@/features/conversations/api/http";
import { deleteRecord, getRecord, putRecord } from "./account-db";
import {
  CONVERSATIONS_CACHE_ID,
  conversationCacheId,
  type ConversationCacheRecord,
  type StoredRecord,
} from "./schema";

export interface CachedConversationMessages {
  conversationId: number;
  hasMoreBefore: boolean;
  lastSyncedRevision: number | null;
  messages: Message[];
  oldestPosition: number | null;
  savedAt: number;
}

interface ConversationListRecord extends StoredRecord {
  conversations: Conversation[];
}

function newestPersisted(messages: Message[]): Message[] {
  const persisted = messages.filter((message) => message.id > 0);
  const ordered = [...persisted].sort((left, right) => left.position - right.position);
  if (ordered.length <= CLIENT_CACHE_SIZE) {
    return ordered;
  }
  return ordered.slice(ordered.length - CLIENT_CACHE_SIZE);
}

export async function cacheConversationMessages(
  accountId: number,
  conversationId: number,
  messages: Message[],
  meta: {
    hasMoreBefore: boolean;
    lastSyncedRevision: number | null;
    oldestPosition: number | null;
  },
): Promise<void> {
  const toStore = newestPersisted(messages);
  await putRecord(accountId, "cache", {
    conversationId,
    hasMoreBefore: meta.hasMoreBefore,
    id: conversationCacheId(conversationId),
    lastSyncedRevision: meta.lastSyncedRevision,
    messages: toStore,
    oldestPosition: meta.oldestPosition ?? toStore[0]?.position ?? null,
    savedAt: Date.now(),
  } satisfies ConversationCacheRecord);
}

export async function getCachedConversationMessages(
  accountId: number,
  conversationId: number,
): Promise<CachedConversationMessages | null> {
  const record = await getRecord<ConversationCacheRecord>(
    accountId,
    "cache",
    conversationCacheId(conversationId),
  );
  if (!record) {
    return null;
  }
  return {
    conversationId: record.conversationId,
    hasMoreBefore: record.hasMoreBefore,
    lastSyncedRevision: record.lastSyncedRevision,
    messages: record.messages as Message[],
    oldestPosition: record.oldestPosition,
    savedAt: record.savedAt,
  };
}

export async function upsertCachedMessages(
  accountId: number,
  conversationId: number,
  messages: Message[],
): Promise<void> {
  const persisted = messages.filter((message) => message.id > 0);
  if (persisted.length === 0) {
    return;
  }
  const current = await getCachedConversationMessages(accountId, conversationId);
  const byId = new Map((current?.messages ?? []).map((message) => [message.id, message]));
  for (const message of persisted) {
    byId.set(message.id, message);
  }
  await cacheConversationMessages(accountId, conversationId, [...byId.values()], {
    hasMoreBefore: current?.hasMoreBefore ?? false,
    lastSyncedRevision: current?.lastSyncedRevision ?? null,
    oldestPosition: current?.oldestPosition ?? null,
  });
}

export async function clearCachedConversation(
  accountId: number,
  conversationId: number,
): Promise<void> {
  await deleteRecord(accountId, "cache", conversationCacheId(conversationId));
}

export async function cacheConversationList(
  accountId: number,
  conversations: Conversation[],
): Promise<void> {
  await putRecord(accountId, "cache", {
    conversations,
    id: CONVERSATIONS_CACHE_ID,
  } satisfies ConversationListRecord);
}

export async function getCachedConversationList(
  accountId: number,
): Promise<Conversation[] | null> {
  const record = await getRecord<ConversationListRecord>(
    accountId,
    "cache",
    CONVERSATIONS_CACHE_ID,
  );
  return record?.conversations ?? null;
}
