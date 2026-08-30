export type MessageSide = "sent" | "received";
export type BubbleRole = "single" | "first" | "middle" | "last";
export type TickStatus = "queued" | "sent" | "delivered" | "read" | "failed";
export type SystemEventKey =
  | "avatar_changed"
  | "call_ended"
  | "call_missed"
  | "call_started"
  | "chat_created"
  | "conversation_created"
  | "description_changed"
  | "forwarding_restricted"
  | "forwarding_unrestricted"
  | "icon_changed"
  | "member_added"
  | "member_demoted"
  | "member_joined"
  | "member_left"
  | "member_promoted"
  | "member_removed"
  | "message_pinned"
  | "message_unpinned"
  | "ownership_transferred"
  | "permissions_changed"
  | "role_changed"
  | "slow_mode_changed"
  | "title_changed";

export interface GroupableMessage {
  id: string;
  senderId: string;
  createdAt: number;
}

export interface MessageRun {
  senderId: string;
  messages: GroupableMessage[];
}

/** Consecutive messages from one sender group when they fall within this window (DS-4). */
export const MESSAGE_GROUP_WINDOW_MS = 180_000;

export const JUMBO_EMOJI_MIN = 1;
export const JUMBO_EMOJI_MAX = 3;

export const TYPING_DOT_COUNT = 3;

export const COPY_FEEDBACK_MS = 1500;

export const HIGHLIGHT_LANGS = [
  "bash",
  "css",
  "html",
  "javascript",
  "json",
  "markdown",
  "python",
  "ruby",
  "sql",
  "typescript",
] as const;

export type HighlightLang = (typeof HIGHLIGHT_LANGS)[number];

const LANG_ALIASES: Record<string, HighlightLang> = {
  js: "javascript",
  py: "python",
  rb: "ruby",
  sh: "bash",
  ts: "typescript",
};

const HIGHLIGHT_LANG_SET = new Set<string>(HIGHLIGHT_LANGS);

export const PLAIN_HIGHLIGHT_LANG = "text";

export function resolveHighlightLang(lang: string): string {
  const normalized = lang.trim().toLowerCase();
  if (normalized.length === 0) {
    return PLAIN_HIGHLIGHT_LANG;
  }
  const aliased = LANG_ALIASES[normalized];
  if (aliased) {
    return aliased;
  }
  if (HIGHLIGHT_LANG_SET.has(normalized)) {
    return normalized;
  }
  return PLAIN_HIGHLIGHT_LANG;
}

export const DISABLED_MARKDOWN_CONSTRUCTS = [
  "definition",
  "headingAtx",
  "headingSetext",
  "htmlFlow",
  "htmlText",
  "labelStartImage",
  "setextUnderline",
  "thematicBreak",
] as const;
