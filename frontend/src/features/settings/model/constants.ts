export const SETTINGS_PANELS = ["appearance", "chats", "devices", "stickers"] as const;
export type SettingsSectionId = (typeof SETTINGS_PANELS)[number];
export type SettingsPanelId = SettingsSectionId | "hub" | "admin";

export const EXPORT_FORMATS = ["json", "txt", "html"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const STICKER_PACK_KINDS = ["sticker", "emoji"] as const;
export type StickerPackKind = (typeof STICKER_PACK_KINDS)[number];

export const EXPORT_ALL_CONVERSATIONS = "all";
export const EXPORT_POLL_MS = 2_000;
