import type { SessionView } from "@/features/conversations/model/report";
import type { components } from "@/shared/lib/api/schema";

export type DeviceSession = components["schemas"]["DeviceSession"];
export type ExportJob = components["schemas"]["ExportJob"];
export type StickerPack = components["schemas"]["StickerPack"];
export type Conversation = components["schemas"]["Conversation"];
export type Account = components["schemas"]["Account"];

export function mapDeviceSession(session: DeviceSession): SessionView {
  return {
    current: session.current,
    deviceLabel: session.device_label ?? null,
    expiresAt: session.expires_at,
    id: String(session.id),
    ip: session.ip ?? null,
    lastSeenAt: session.last_seen_at,
    revoked: session.revoked,
    userAgent: session.user_agent ?? null,
  };
}

export function canRevokeOtherSessions(sessions: DeviceSession[]): boolean {
  return sessions.some((session) => !session.current && !session.revoked);
}

export function shouldPollExportJobs(jobs: ExportJob[]): boolean {
  return jobs.some((job) => job.status === "pending" || job.status === "processing");
}

export function isOwnedStickerPack(pack: StickerPack, accountId: number | undefined): boolean {
  return accountId != null && pack.owner_account_id === accountId;
}

export function exportableConversations(conversations: Conversation[]): Conversation[] {
  return conversations.filter((conversation) => !conversation.restrict_forwarding);
}

export function nicknameSearchHits(accounts: Account[], ownerAccountId: number | undefined): Account[] {
  return accounts.filter((account) => account.id !== ownerAccountId);
}

export function queryListStatus(
  pending: boolean,
  error: boolean,
  empty: boolean,
): "loading" | "empty" | "error" | "ready" {
  if (pending) {
    return "loading";
  }
  if (error) {
    return "error";
  }
  if (empty) {
    return "empty";
  }
  return "ready";
}
