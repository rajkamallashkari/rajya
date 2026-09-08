import {
  Bell,
  Bot,
  ChevronRight,
  Clock,
  MessageSquare,
  Monitor,
  Palette,
  Shield,
  ShieldCheck,
  ShieldEllipsis,
  Sparkles,
  Star,
  Sticker,
  Users,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { LayerHeader } from "@/app/navigation/layer-header";
import { useMe } from "@/features/admin/api/queries";
import { AccountsPanel } from "@/features/settings/components/accounts-panel";
import { AiPanel } from "@/features/settings/components/ai-panel";
import { BotsPanel } from "@/features/settings/components/bots-panel";
import { ChatsPanel } from "@/features/settings/components/chats-panel";
import { DevicesPanel } from "@/features/settings/components/devices-panel";
import { DisplayPanel } from "@/features/settings/components/display-panel";
import { NotificationsPanel } from "@/features/settings/components/notifications-panel";
import { PrivacyPanel } from "@/features/settings/components/privacy-panel";
import { ScheduledPanel } from "@/features/settings/components/scheduled-panel";
import { SecurityPanel } from "@/features/settings/components/security-panel";
import { StarredPanel } from "@/features/settings/components/starred-panel";
import { StickersPanel } from "@/features/settings/components/stickers-panel";
import { SETTINGS_PANELS, type SettingsSectionId } from "@/features/settings/model/constants";
import { settingsPanelTitleKey } from "@/features/settings/model/titles";
import { useShellStore } from "@/features/settings/store/shell-store";
import { Button } from "@/shared/ui";
import { ICON_CLASS, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

const SECTION_ICONS: Record<SettingsSectionId, typeof Palette> = {
  accounts: Users,
  ai: Sparkles,
  bots: Bot,
  chats: MessageSquare,
  devices: Monitor,
  display: Palette,
  notifications: Bell,
  privacy: ShieldEllipsis,
  scheduled: Clock,
  security: ShieldCheck,
  starred: Star,
  stickers: Sticker,
};

export function SettingsPanel({ onClose }: { onClose?: () => void } = {}) {
  const { t } = useTranslation();
  const panel = useShellStore((state) => state.settingsPanel);
  const setSettingsPanel = useShellStore((state) => state.setSettingsPanel);

  useEffect(() => {
    return () => {
      setSettingsPanel("hub");
    };
  }, [setSettingsPanel]);

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-[var(--surface-panel)]"
      data-settings-panel=""
      data-settings-section={panel}
    >
      <LayerHeader
        onBack={panel === "hub" ? onClose : () => setSettingsPanel("hub")}
        title={t(settingsPanelTitleKey(panel))}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-[var(--control-gap)] overflow-y-auto px-[var(--space-list-x)] py-[var(--space-4)]">
        {panel === "hub" ? <SettingsHub /> : null}
        {panel === "notifications" ? <NotificationsPanel /> : null}
        {panel === "privacy" ? <PrivacyPanel /> : null}
        {panel === "security" ? <SecurityPanel /> : null}
        {panel === "display" ? <DisplayPanel /> : null}
        {panel === "ai" ? <AiPanel /> : null}
        {panel === "starred" ? <StarredPanel /> : null}
        {panel === "scheduled" ? <ScheduledPanel /> : null}
        {panel === "chats" ? <ChatsPanel /> : null}
        {panel === "devices" ? <DevicesPanel /> : null}
        {panel === "stickers" ? <StickersPanel /> : null}
        {panel === "bots" ? <BotsPanel /> : null}
        {panel === "accounts" ? <AccountsPanel /> : null}
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
              <span className={WEIGHT_EMPHASIS}>{t(settingsPanelTitleKey(section))}</span>
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
