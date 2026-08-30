export const ACCOUNT_STORES = ["outbox", "cache", "drafts", "keyval"] as const;

export type AccountStoreName = (typeof ACCOUNT_STORES)[number];

export const ACCOUNT_DB_VERSION = 2;

export const ACCOUNT_DB_PREFIX = "rajya:";

export const AUTH_CACHE_KEY = "auth";

export const CONVERSATIONS_CACHE_ID = "conversations";

export type OutboxStatus = "queued" | "sending" | "failed";

export type OutboxFailReason = "network" | "rejected" | "auth";

export function accountDatabaseName(accountId: number): string {
  return `${ACCOUNT_DB_PREFIX}${String(accountId)}`;
}

export function parseAccountDatabaseId(name: string | undefined): number | null {
  if (!name?.startsWith(ACCOUNT_DB_PREFIX)) {
    return null;
  }
  const suffix = name.slice(ACCOUNT_DB_PREFIX.length);
  if (!/^\d+$/.test(suffix)) {
    return null;
  }
  return Number(suffix);
}

export function conversationCacheId(conversationId: number): string {
  return `messages:${String(conversationId)}`;
}

export interface StoredRecord {
  id: string;
}

export interface OutboxRecord extends StoredRecord {
  attempts: number;
  body: string;
  conversationId: number;
  createdAt: string;
  failReason?: OutboxFailReason | null;
  queuedAt?: number;
  replyToMessageId?: number | null;
  silent?: boolean;
  status: OutboxStatus;
}

export interface AuthCacheRecord extends StoredRecord {
  accountId: number;
  apiUrl: string;
  token: string;
}

export interface ConversationCacheRecord extends StoredRecord {
  conversationId: number;
  hasMoreBefore: boolean;
  lastSyncedRevision: number | null;
  messages: unknown[];
  oldestPosition: number | null;
  savedAt: number;
}
