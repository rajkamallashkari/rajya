import { createApiClient } from "@/shared/lib/api/client";
import type { components } from "@/shared/lib/api/schema";
import type { OutboxFailReason } from "@/shared/lib/db/schema";

export type Message = components["schemas"]["Message"];

export class OutboxSendError extends Error {
  public readonly reason: OutboxFailReason;

  public constructor(reason: OutboxFailReason) {
    super(reason);
    this.reason = reason;
  }
}

export interface SendOutboxInput {
  body: string;
  clientNonce: string;
  conversationId: number;
  origin: string;
  replyToMessageId?: number | null;
  silent?: boolean;
  token: string;
}

function errorCode(error: unknown): string | undefined {
  if (error === null || typeof error !== "object") {
    return undefined;
  }
  const record = error as { code?: unknown; error?: { code?: unknown } };
  if (typeof record.code === "string") {
    return record.code;
  }
  if (typeof record.error?.code === "string") {
    return record.error.code;
  }
  return undefined;
}

export function sendErrorFromResult(result: {
  error?: unknown;
  response?: Response;
}): OutboxSendError {
  const status = result.response?.status;
  const code = errorCode(result.error);
  if (status === 401 || code === "unauthenticated") {
    return new OutboxSendError("auth");
  }
  if (status === 429 || code === "rate_limited") {
    return new OutboxSendError("network");
  }
  if (status != null && status >= 500) {
    return new OutboxSendError("network");
  }
  if (status == null) {
    return new OutboxSendError("network");
  }
  return new OutboxSendError("rejected");
}

export async function sendOutboxMessage(input: SendOutboxInput): Promise<Message> {
  if (globalThis.navigator?.onLine === false) {
    throw new OutboxSendError("network");
  }
  const client = createApiClient(input.origin);
  try {
    const result = await client.POST("/api/v1/messages", {
      body: {
        body: input.body,
        client_nonce: input.clientNonce,
        conversation_id: input.conversationId,
        reply_to_message_id: input.replyToMessageId ?? undefined,
        silent: input.silent,
      },
      headers: { Authorization: `Bearer ${input.token}` },
    });
    if (result.data) {
      return result.data;
    }
    throw sendErrorFromResult(result);
  } catch (error) {
    if (error instanceof OutboxSendError) {
      throw error;
    }
    throw new OutboxSendError("network");
  }
}

export function classifySendError(error: unknown): OutboxFailReason {
  if (error instanceof OutboxSendError) {
    return error.reason;
  }
  return "network";
}
