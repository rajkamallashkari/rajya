export const RECENT_EMOJI_CAP = 30;

export const PICKER_TABS = ["emoji", "stickers", "gifs", "replies"] as const;
export type PickerTab = (typeof PICKER_TABS)[number];

export const SKIN_TONE_MODIFIERS = [
  "",
  "\u{1F3FB}",
  "\u{1F3FC}",
  "\u{1F3FD}",
  "\u{1F3FE}",
  "\u{1F3FF}",
] as const;

export const TONEABLE_EMOJI = new Set(["👍", "👎", "👋", "👏", "🙏", "💪"]);

export const DEFAULT_EMOJI = [
  "😀",
  "😂",
  "😍",
  "🙏",
  "👍",
  "👎",
  "👋",
  "👏",
  "💪",
  "🔥",
  "❤️",
  "🎉",
  "😮",
  "😭",
  "🤔",
  "✅",
] as const;

export interface StickerView {
  id: string;
  packId: string;
  shortcode: string;
}

export interface GifView {
  id: string;
  previewLabel: string;
  title: string;
}

export interface SavedReplyView {
  body: string;
  id: string;
  shortcut: string;
}

export function applySkinTone(emoji: string, tone: number): string {
  if (tone <= 0 || !TONEABLE_EMOJI.has(emoji)) {
    return emoji;
  }
  const modifier = SKIN_TONE_MODIFIERS[tone] ?? SKIN_TONE_MODIFIERS[0];
  return `${emoji}${modifier}`;
}

export function rememberEmoji(recent: string[], emoji: string, cap = RECENT_EMOJI_CAP): string[] {
  const next = [emoji, ...recent.filter((item) => item !== emoji)];
  if (next.length <= cap) {
    return next;
  }
  return next.slice(0, cap);
}

export function filterGifs(items: GifView[], query: string): GifView[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return items;
  }
  return items.filter((item) => item.title.toLowerCase().includes(q));
}

export function filterReplies(items: SavedReplyView[], query: string): SavedReplyView[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return items;
  }
  return items.filter(
    (item) => item.shortcut.toLowerCase().includes(q) || item.body.toLowerCase().includes(q),
  );
}

export interface SlashCommand {
  description: string;
  name: string;
  source: "builtin" | "bot";
  usageHint?: string;
}

export function commandQuery(raw: string): string {
  return raw.replace(/^\//, "").trim().toLowerCase();
}

export function filterCommands(commands: SlashCommand[], raw: string): SlashCommand[] {
  const q = commandQuery(raw);
  if (q.length === 0) {
    return commands;
  }
  return commands.filter(
    (command) =>
      command.name.toLowerCase().startsWith(q) || command.description.toLowerCase().includes(q),
  );
}
