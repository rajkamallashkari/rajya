import type { Conversation, Message } from "@/features/conversations/api/http";

export interface GenerationState {
  botAccountId: number;
  generationId: string;
  text: string;
}

interface MessageGenerationMeta {
  generation_id?: unknown;
  prompted_by_account_id?: unknown;
}

export function messageGenerationMeta(message: Message): MessageGenerationMeta {
  return (message.metadata ?? {}) as MessageGenerationMeta;
}

export function promptedByAccountId(message: Message): number | null {
  const value = messageGenerationMeta(message).prompted_by_account_id;
  const id = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  return id;
}

export function canRegenerateBotReply(message: Message, viewerId: number): boolean {
  return (
    message.sender?.kind === "bot" && !message.deleted && promptedByAccountId(message) === viewerId
  );
}

export function generationMatchesReply(state: GenerationState, message: Message): boolean {
  const meta = messageGenerationMeta(message);
  return meta.generation_id === state.generationId || message.sender?.id === state.botAccountId;
}

export function generationSenderName(
  generation: GenerationState | null,
  conversation: Pick<Conversation, "members" | "peer">,
  untitled: string,
): string {
  if (generation == null) {
    return untitled;
  }
  return (
    conversation.members.find((member) => member.account.id === generation.botAccountId)?.account
      .display_name ??
    conversation.peer?.display_name ??
    untitled
  );
}
