import { listAccountDatabaseIds } from "@/shared/lib/db/account-db";
import { getAuthCache, type AuthCache } from "@/shared/lib/db/auth-cache";
import {
  getQueuedOutbox,
  groupOutboxByConversation,
  patchOutbox,
  queueOutbox,
  queuedOutbox,
  removeOutbox,
  resetSendingOutbox,
  sortOutbox,
  type OutboxRecord,
} from "@/shared/lib/db/outbox";
import { withOutboxLock } from "./lock";
import { classifySendError, OutboxSendError, sendOutboxMessage, type Message } from "./send";
import { registerOutboxSync } from "./sync";

export interface OutboxSendDeps {
  send?: (entry: OutboxRecord, auth: AuthCache | undefined) => Promise<Message>;
  sync?: () => void;
}

export interface OutboxFlushResult {
  failed: Record<string, OutboxRecord["failReason"]>;
  queued: string[];
  sent: Record<string, Message>;
}

export interface OutboxCallbacks {
  onFailed?: (entry: OutboxRecord, reason: NonNullable<OutboxRecord["failReason"]>) => void;
  onSent?: (entry: OutboxRecord, message: Message) => void;
}

let callbacks: OutboxCallbacks = {};

export function setOutboxCallbacks(next: OutboxCallbacks): void {
  callbacks = next;
}

export function resetOutboxProcessor(): void {
  callbacks = {};
}

async function defaultSend(entry: OutboxRecord, auth: AuthCache | undefined): Promise<Message> {
  if (!auth) {
    throw new OutboxSendError("auth");
  }
  return sendOutboxMessage({
    body: entry.body,
    clientNonce: entry.id,
    conversationId: entry.conversationId,
    origin: auth.apiUrl,
    replyToMessageId: entry.replyToMessageId,
    silent: entry.silent,
    token: auth.token,
  });
}

function emptyResult(): OutboxFlushResult {
  return { failed: {}, queued: [], sent: {} };
}

async function processEntry(
  accountId: number,
  entry: OutboxRecord,
  deps: OutboxSendDeps,
  result: OutboxFlushResult,
): Promise<boolean> {
  await patchOutbox(accountId, entry.id, {
    attempts: entry.attempts + 1,
    status: "sending",
  });
  try {
    const auth = await getAuthCache(accountId);
    const send = deps.send ?? defaultSend;
    const message = await send(entry, auth);
    await removeOutbox(accountId, entry.id);
    result.sent[entry.id] = message;
    callbacks.onSent?.(entry, message);
    return true;
  } catch (error) {
    const reason = classifySendError(error);
    if (reason === "network") {
      await patchOutbox(accountId, entry.id, { status: "queued", failReason: null });
      result.queued.push(entry.id);
      (deps.sync ?? registerOutboxSync)();
      return false;
    }
    await patchOutbox(accountId, entry.id, { failReason: reason, status: "failed" });
    result.failed[entry.id] = reason;
    callbacks.onFailed?.(entry, reason);
    return true;
  }
}

async function processConversation(
  accountId: number,
  entries: OutboxRecord[],
  deps: OutboxSendDeps,
  result: OutboxFlushResult,
): Promise<void> {
  for (const entry of sortOutbox(entries)) {
    const shouldContinue = await processEntry(accountId, entry, deps, result);
    if (!shouldContinue) {
      break;
    }
  }
}

export async function drainOutbox(
  accountId: number,
  deps: OutboxSendDeps = {},
): Promise<OutboxFlushResult> {
  return withOutboxLock(accountId, async () => {
    await resetSendingOutbox(accountId);
    const queued = await getQueuedOutbox(accountId);
    const result = emptyResult();
    if (queued.length === 0) {
      return result;
    }
    const grouped = groupOutboxByConversation(queued);
    await Promise.allSettled(
      [...grouped.entries()].map(([, entries]) =>
        processConversation(accountId, entries, deps, result),
      ),
    );
    return result;
  });
}

export async function enqueueOutbox(
  accountId: number,
  record: Omit<OutboxRecord, "attempts" | "status"> & Partial<Pick<OutboxRecord, "attempts" | "status">>,
): Promise<void> {
  await queueOutbox(accountId, queuedOutbox(record));
}

export async function enqueueAndFlush(
  accountId: number,
  record: Omit<OutboxRecord, "attempts" | "status"> & Partial<Pick<OutboxRecord, "attempts" | "status">>,
  deps: OutboxSendDeps = {},
): Promise<OutboxFlushResult> {
  await enqueueOutbox(accountId, queuedOutbox(record));
  return drainOutbox(accountId, deps);
}

export async function retryOutbox(
  accountId: number,
  id: string,
  deps: OutboxSendDeps = {},
): Promise<OutboxFlushResult> {
  await patchOutbox(accountId, id, { attempts: 0, failReason: null, status: "queued" });
  return drainOutbox(accountId, deps);
}

export async function drainAllOutboxes(deps: OutboxSendDeps = {}): Promise<OutboxFlushResult> {
  const ids = await listAccountDatabaseIds();
  const merged = emptyResult();
  for (const accountId of ids) {
    const result = await drainOutbox(accountId, deps);
    Object.assign(merged.sent, result.sent);
    Object.assign(merged.failed, result.failed);
    merged.queued.push(...result.queued);
  }
  return merged;
}
