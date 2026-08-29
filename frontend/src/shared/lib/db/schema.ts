export const ACCOUNT_STORES = ["outbox", "cache", "drafts"] as const;

export type AccountStoreName = (typeof ACCOUNT_STORES)[number];

export const ACCOUNT_DB_VERSION = 1;

export function accountDatabaseName(accountId: number): string {
  return `rajya:${accountId}`;
}

export interface StoredRecord {
  id: string;
  [key: string]: unknown;
}

export interface OutboxRecord extends StoredRecord {
  body: string;
  createdAt: string;
}
