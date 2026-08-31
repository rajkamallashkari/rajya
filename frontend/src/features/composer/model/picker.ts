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
  url?: string | null;
}

export interface GifView {
  id: string;
  previewLabel: string;
  previewUrl?: string | null;
  title: string;
}

export const PICKER_SLASH_NAMES = ["sticker", "gif"] as const;

export function isPickerSlash(name: string): boolean {
  return (PICKER_SLASH_NAMES as readonly string[]).includes(name);
}

export function pickerTabForSlash(name: string): PickerTab | null {
  if (name === "sticker") {
    return "stickers";
  }
  if (name === "gif") {
    return "gifs";
  }
  return null;
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

export function gifsFromList(
  gifs: Array<{ id: string; preview_url: string; title: string }> | undefined,
): GifView[] {
  return (gifs ?? []).map((gif) => ({
    id: gif.id,
    previewLabel: gif.title,
    previewUrl: gif.preview_url,
    title: gif.title,
  }));
}

export function stickerViewsFromPacks(
  packs:
    | Array<{
        id: number;
        kind: "emoji" | "sticker";
        stickers: Array<{ id: number; shortcode: string; url?: string | null }>;
      }>
    | undefined,
): StickerView[] {
  return (packs ?? [])
    .filter((pack) => pack.kind === "sticker")
    .flatMap((pack) =>
      pack.stickers.map((sticker) => ({
        id: String(sticker.id),
        packId: String(pack.id),
        shortcode: sticker.shortcode,
        url: sticker.url,
      })),
    );
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

export function expandSavedReplyShortcut(text: string, replies: SavedReplyView[]): string {
  if (replies.length === 0 || (!text.endsWith(" ") && !text.endsWith("\n"))) {
    return text;
  }
  const delimiter = text.slice(-1);
  const before = text.slice(0, -1);
  const parts = before.split(/(\s+)/);
  const token = parts.at(-1);
  if (!token) {
    return text;
  }
  const reply = replies.find((item) => item.shortcut.toLowerCase() === token.toLowerCase());
  if (!reply || token === reply.body) {
    return text;
  }
  parts[parts.length - 1] = reply.body;
  return `${parts.join("")}${delimiter}`;
}

export function savedRepliesAsCommands(replies: SavedReplyView[]): SlashCommand[] {
  return replies.map((reply) => ({
    description: reply.body,
    name: reply.shortcut.replace(/^\//, ""),
    source: "saved_reply",
  }));
}

export interface SlashCommand {
  botAccountId?: number | null;
  clientAction?: "open_sticker_picker" | "open_gif_picker" | null;
  description: string;
  name: string;
  source: "builtin" | "bot" | "saved_reply";
  usageHint?: string;
}

export function slashCommandsFromApi(
  rows:
    | Array<{
        bot_account_id?: number | null;
        client_action?: "open_sticker_picker" | "open_gif_picker" | null;
        description: string;
        name: string;
        source: "builtin" | "bot";
        usage_hint?: string | null;
      }>
    | undefined,
): SlashCommand[] {
  return (rows ?? []).map((row) => ({
    botAccountId: row.bot_account_id,
    clientAction: row.client_action,
    description: row.description,
    name: row.name,
    source: row.source,
    usageHint: row.usage_hint ?? undefined,
  }));
}

export function isPickerCommand(command: SlashCommand): boolean {
  return (
    command.clientAction === "open_sticker_picker" ||
    command.clientAction === "open_gif_picker" ||
    isPickerSlash(command.name)
  );
}

export function commandQuery(raw: string): string {
  return raw.replace(/^\//, "").trim().split(/\s+/)[0]!.toLowerCase();
}

export function slashMenuOpen(raw: string): boolean {
  return raw.startsWith("/") && !/\s/.test(raw.slice(1));
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
