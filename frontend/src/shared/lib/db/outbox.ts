import { putRecord, getAllRecords, deleteRecord } from "./account-db";
import type { OutboxRecord } from "./schema";

export async function queueOutbox(accountId: number, record: OutboxRecord): Promise<void> {
  await putRecord(accountId, "outbox", record);
}

export async function listOutbox(accountId: number): Promise<OutboxRecord[]> {
  return getAllRecords<OutboxRecord>(accountId, "outbox");
}

export async function removeOutbox(accountId: number, id: string): Promise<void> {
  await deleteRecord(accountId, "outbox", id);
}
