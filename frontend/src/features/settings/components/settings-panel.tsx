import { ChevronRight, MessageSquare, Monitor, Palette, Shield, Sticker } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { LayerHeader } from "@/app/navigation/layer-header";
import { useMe } from "@/features/admin";
import { AppearancePanel } from "@/features/settings/components/appearance-panel";
import { ChatsPanel } from "@/features/settings/components/chats-panel";
import { DevicesPanel } from "@/features/settings/components/devices-panel";
import { StickersPanel } from "@/features/settings/components/stickers-panel";
import { WallpaperPicker } from "@/features/settings/components/wallpaper-picker";
import { SETTINGS_PANELS, type SettingsSectionId } from "@/features/settings/model/constants";
import { useShellStore } from "@/features/settings/store/shell-store";
import { Button } from "@/shared/ui";
import { ICON_CLASS, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

const SECTION_ICONS: Record<SettingsSectionId, typeof Palette> = {
  appearance: Palette,
  chats: MessageSquare,
  devices: Monitor,
  stickers: Sticker,
};

export function SettingsPanel() {
  const { t } = useTranslation();
  const panel = useShellStore((state) => state.settingsPanel);
  const setSettingsPanel = useShellStore((state) => state.setSettingsPanel);

  useEffect(() => {
    return () => {
      setSettingsPanel("hub");
    };
  }, [setSettingsPanel]);

  const title =
    panel === "hub"
      ? t("shell.settings")
      : panel === "stickers"
        ? t("settings.sticker_packs.title")
        : t(`settings.${panel}`);

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]"
      data-settings-panel=""
      data-settings-section={panel}
    >
      <LayerHeader
        onBack={panel === "hub" ? undefined : () => setSettingsPanel("hub")}
        title={title}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-[var(--control-gap)] overflow-y-auto px-[var(--space-list-x)] py-[var(--space-4)]">
        {panel === "hub" ? <SettingsHub /> : null}
        {panel === "appearance" ? (
          <>
            <AppearancePanel />
            <WallpaperPicker />
          </>
        ) : null}
        {panel === "chats" ? <ChatsPanel /> : null}
        {panel === "devices" ? <DevicesPanel /> : null}
        {panel === "stickers" ? <StickersPanel /> : null}
      </div>
    </div>
  );
}

function SettingsHub(): ReactNode {
  const { t } = useTranslation();
  const setSettingsPanel = useShellStore((state) => state.setSettingsPanel);
  const me = useMe();
  const isAdmin = me.data?.user.is_admin === true;
  return (
    <nav aria-label={t("settings.title")} className="flex flex-col">
      {SETTINGS_PANELS.map((section) => {
        const Icon = SECTION_ICONS[section];
        const label =
          section === "stickers" ? t("settings.sticker_packs.title") : t(`settings.${section}`);
        return (
          <Button
            className="h-auto w-full justify-between px-[var(--space-list-x)] py-[var(--space-list-y)]"
            key={section}
            onClick={() => setSettingsPanel(section)}
            type="button"
            variant="ghost"
          >
            <span className="flex min-w-0 items-center gap-[var(--control-gap)]">
              <Icon aria-hidden="true" className={ICON_CLASS} />
              <span className={WEIGHT_EMPHASIS}>{label}</span>
            </span>
            <ChevronRight aria-hidden="true" className={ICON_CLASS} />
          </Button>
        );
      })}
      {isAdmin ? (
        <Button
          asChild
          className="h-auto w-full justify-between px-[var(--space-list-x)] py-[var(--space-list-y)]"
          variant="ghost"
        >
          <Link to="/admin">
            <span className="flex min-w-0 items-center gap-[var(--control-gap)]">
              <Shield aria-hidden="true" className={ICON_CLASS} />
              <span className={WEIGHT_EMPHASIS}>{t("admin.title")}</span>
            </span>
            <ChevronRight aria-hidden="true" className={ICON_CLASS} />
          </Link>
        </Button>
      ) : null}
    </nav>
  );
}
