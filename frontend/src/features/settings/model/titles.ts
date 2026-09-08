import type { SettingsPanelId } from "@/features/settings/model/constants";

export function settingsPanelTitleKey(panel: SettingsPanelId): string {
  if (panel === "hub") {
    return "shell.settings";
  }
  if (panel === "stickers") {
    return "settings.sticker_packs.title";
  }
  return `settings.${panel}`;
}
