import { listOutbox } from "@/shared/lib/db/outbox";
import { drainAllOutboxes, type OutboxFlushResult } from "./processor";
import type { Message } from "./send";

export const OUTBOX_SYNC_SUCCESS = "OUTBOX_SYNC_SUCCESS";
export const OUTBOX_SYNC_FAILED = "OUTBOX_SYNC_FAILED";
export const OUTBOX_SYNC_EXHAUSTED = "OUTBOX_SYNC_EXHAUSTED";

export interface OutboxSyncSuccessMessage {
  clientId: string;
  conversationId: number;
  message: Message;
  type: typeof OUTBOX_SYNC_SUCCESS;
}

export interface OutboxSyncFailedMessage {
  clientId: string;
  conversationId: number;
  reason: string;
  type: typeof OUTBOX_SYNC_FAILED;
}

export interface OutboxSyncExhaustedMessage {
  count: number;
  type: typeof OUTBOX_SYNC_EXHAUSTED;
}

export type OutboxWorkerMessage =
  | OutboxSyncSuccessMessage
  | OutboxSyncFailedMessage
  | OutboxSyncExhaustedMessage;

export async function drainFromServiceWorker(options: {
  drain?: () => Promise<OutboxFlushResult>;
  lastChance?: boolean;
  postMessage?: (data: OutboxWorkerMessage) => void;
}): Promise<OutboxFlushResult> {
  const result = await (options.drain ?? drainAllOutboxes)();
  const postMessage = options.postMessage;
  if (postMessage) {
    for (const [clientId, message] of Object.entries(result.sent)) {
      postMessage({
        clientId,
        conversationId: message.conversation_id,
        message,
        type: OUTBOX_SYNC_SUCCESS,
      });
    }
    for (const [clientId, reason] of Object.entries(result.failed)) {
      postMessage({
        clientId,
        conversationId: 0,
        reason: reason ?? "rejected",
        type: OUTBOX_SYNC_FAILED,
      });
    }
    if (options.lastChance && result.queued.length > 0) {
      postMessage({ count: result.queued.length, type: OUTBOX_SYNC_EXHAUSTED });
    }
  }
  return result;
}

export async function queuedCountFor(accountId: number): Promise<number> {
  return (await listOutbox(accountId)).filter((entry) => !entry.status || entry.status === "queued")
    .length;
}
