import { deleteRecord, getAllRecords, getRecord, putRecord } from "./account-db";
import type { OutboxFailReason, OutboxRecord, OutboxStatus } from "./schema";
import { withOutboxLock } from "@/shared/lib/outbox/lock";

export type { OutboxFailReason, OutboxRecord, OutboxStatus } from "./schema";

export function queuedOutbox(
  record: Omit<OutboxRecord, "attempts" | "status"> & Partial<Pick<OutboxRecord, "attempts" | "status">>,
): OutboxRecord {
  return {
    ...record,
    attempts: record.attempts ?? 0,
    status: record.status ?? "queued",
  };
}

export async function queueOutbox(accountId: number, record: OutboxRecord): Promise<void> {
  await withOutboxLock(accountId, async () => {
    const existing = await listOutbox(accountId);
    const maxQueuedAt = existing.reduce((max, row) => Math.max(max, row.queuedAt ?? 0), 0);
    await putRecord(
      accountId,
      "outbox",
      queuedOutbox({
        ...record,
        queuedAt: record.queuedAt ?? Math.max(Date.now(), maxQueuedAt + 1),
      }),
    );
  });
}

export async function listOutbox(accountId: number): Promise<OutboxRecord[]> {
  return getAllRecords<OutboxRecord>(accountId, "outbox");
}

export async function getOutbox(
  accountId: number,
  id: string,
): Promise<OutboxRecord | undefined> {
  return getRecord<OutboxRecord>(accountId, "outbox", id);
}

export async function removeOutbox(accountId: number, id: string): Promise<void> {
  await deleteRecord(accountId, "outbox", id);
}

export async function patchOutbox(
  accountId: number,
  id: string,
  patch: Partial<Omit<OutboxRecord, "id">>,
): Promise<OutboxRecord | undefined> {
  const existing = await getOutbox(accountId, id);
  if (!existing) {
    return undefined;
  }
  const next = { ...existing, ...patch };
  await putRecord(accountId, "outbox", next);
  return next;
}

export function isQueued(entry: OutboxRecord): boolean {
  return !entry.status || entry.status === "queued";
}

export async function getQueuedOutbox(accountId: number): Promise<OutboxRecord[]> {
  return (await listOutbox(accountId)).filter(isQueued);
}

export async function resetSendingOutbox(accountId: number): Promise<void> {
  const entries = await listOutbox(accountId);
  for (const entry of entries) {
    if (entry.status === "sending") {
      await patchOutbox(accountId, entry.id, { status: "queued" });
    }
  }
}

export function sortOutbox(entries: OutboxRecord[]): OutboxRecord[] {
  return [...entries].sort((left, right) => {
    const byQueued = (left.queuedAt ?? 0) - (right.queuedAt ?? 0);
    if (byQueued !== 0) {
      return byQueued;
    }
    return left.createdAt.localeCompare(right.createdAt);
  });
}

export function groupOutboxByConversation(entries: OutboxRecord[]): Map<number, OutboxRecord[]> {
  const grouped = new Map<number, OutboxRecord[]>();
  for (const entry of entries) {
    const list = grouped.get(entry.conversationId) ?? [];
    list.push(entry);
    grouped.set(entry.conversationId, list);
  }
  return grouped;
}

export function withOutboxStatus(
  entry: OutboxRecord,
  status: OutboxStatus,
  failReason?: OutboxFailReason | null,
): OutboxRecord {
  return { ...entry, failReason, status };
}
