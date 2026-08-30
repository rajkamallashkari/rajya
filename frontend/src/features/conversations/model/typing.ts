import registry from "@/shared/lib/config/settings-registry.json";

export const TYPING_THROTTLE_MS = (registry.typing_throttle.default as number) * 1000;
export const TYPING_KEY_TTL_MS = (registry.typing_key_ttl.default as number) * 1000;

export const ACTIVITY_KINDS = [
  "typing",
  "recording_audio",
  "uploading_media",
  "uploading_file",
] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export interface TypingEntry {
  accountId: number;
  activity: ActivityKind;
  displayName: string;
  expiresAt: number;
}

export function isActivityKind(value: string): value is ActivityKind {
  return (ACTIVITY_KINDS as readonly string[]).includes(value);
}

export function upsertTypingEntry(
  entries: TypingEntry[],
  incoming: TypingEntry,
  now: number,
): TypingEntry[] {
  const live = entries.filter((entry) => entry.expiresAt > now && entry.accountId !== incoming.accountId);
  return [...live, incoming];
}

export function expireTypingEntries(entries: TypingEntry[], now: number): TypingEntry[] {
  return entries.filter((entry) => entry.expiresAt > now);
}

export function removeTypist(entries: TypingEntry[], accountId: number, now: number): TypingEntry[] {
  return expireTypingEntries(entries, now).filter((entry) => entry.accountId !== accountId);
}

export function typingLabelKey(entries: TypingEntry[]): ActivityKind {
  return entries[0]?.activity ?? "typing";
}
