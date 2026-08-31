import { useTranslation } from "react-i18next";
import { AppearancePanel } from "@/features/settings/components/appearance-panel";
import { WallpaperPicker } from "@/features/settings/components/wallpaper-picker";
import { LayerHeader } from "@/app/navigation/layer-header";

export function SettingsPanel() {
  const { t } = useTranslation();
  return (
    <div
      className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]"
      data-settings-panel=""
    >
      <LayerHeader title={t("shell.settings")} />
      <div className="flex min-h-0 flex-1 flex-col gap-[var(--control-gap)] overflow-y-auto px-[var(--space-list-x)] py-[var(--space-4)]">
        <h2 className="[font-weight:var(--font-weight-emphasis)]">{t("settings.appearance")}</h2>
        <AppearancePanel />
        <WallpaperPicker />
      </div>
    </div>
  );
}
