import { useTranslation } from "react-i18next";
import { PreferenceSwitch } from "@/features/settings/components/preference-switch";
import {
  usePreferences,
  useUpdatePreferences,
} from "@/features/settings/api/queries";
import {
  asPreferenceDocument,
  notificationScopeEntries,
  preferenceNotifications,
} from "@/features/settings/model/map-preferences";
import type { PreferenceNotificationScope } from "@/shared/lib/config/preferences-registry";
import preferencesRegistry from "@/shared/lib/config/preferences-registry.json";
import { Button, Input } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

const LEVELS = preferencesRegistry.fields["notifications.level"].values as PreferenceNotificationScope["level"][];
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export function NotificationsPanel() {
  const { t } = useTranslation();
  const preferences = usePreferences();
  const update = useUpdatePreferences();
  const notifications = preferenceNotifications(asPreferenceDocument(preferences.data?.data));

  function patchScope(scope: string, overlay: Partial<PreferenceNotificationScope>): void {
    update.mutate({
      notifications: {
        [scope]: { ...notifications[scope], ...overlay },
      },
    });
  }

  return (
    <div className="flex flex-col gap-[var(--space-6)]" data-notifications-panel="">
      {notificationScopeEntries(notifications).map(([scope, settings]) => (
        <section className="flex flex-col gap-[var(--control-gap)]" key={scope}>
          <h2 className={WEIGHT_EMPHASIS}>
            {scope === "global"
              ? t("settings.notifications_global")
              : t("settings.notifications_chat", { id: scope })}
          </h2>
          <div className="flex flex-wrap gap-[var(--space-2)]" role="group" aria-label={t("settings.notifications_level")}>
            {LEVELS.map((level) => (
              <Button
                key={level}
                onClick={() => patchScope(scope, { level })}
                type="button"
                variant={settings.level === level ? "primary" : "secondary"}
              >
                {t(`settings.notifications_level_${level}`)}
              </Button>
            ))}
          </div>
          <PreferenceSwitch
            checked={settings.show_preview}
            label={t("settings.notifications_preview")}
            onCheckedChange={(checked) => patchScope(scope, { show_preview: checked })}
          />
          <PreferenceSwitch
            checked={settings.sound}
            label={t("settings.notifications_sound")}
            onCheckedChange={(checked) => patchScope(scope, { sound: checked })}
          />
          <PreferenceSwitch
            checked={settings.vibration}
            label={t("settings.notifications_vibration")}
            onCheckedChange={(checked) => patchScope(scope, { vibration: checked })}
          />
          <PreferenceSwitch
            checked={settings.dnd_enabled}
            label={t("settings.notifications_dnd")}
            onCheckedChange={(checked) => patchScope(scope, { dnd_enabled: checked })}
          />
          <label className="flex min-h-[var(--control-height)] items-center justify-between gap-[var(--control-gap)]">
            <span>{t("settings.notifications_dnd_start")}</span>
            <Input
              aria-label={t("settings.notifications_dnd_start")}
              disabled={!settings.dnd_enabled}
              onChange={(event) => patchScope(scope, { dnd_start: event.target.value })}
              type="time"
              value={settings.dnd_start}
            />
          </label>
          <label className="flex min-h-[var(--control-height)] items-center justify-between gap-[var(--control-gap)]">
            <span>{t("settings.notifications_dnd_end")}</span>
            <Input
              aria-label={t("settings.notifications_dnd_end")}
              disabled={!settings.dnd_enabled}
              onChange={(event) => patchScope(scope, { dnd_end: event.target.value })}
              type="time"
              value={settings.dnd_end}
            />
          </label>
          <div className="flex flex-wrap gap-[var(--space-1)]" role="group" aria-label={t("settings.notifications_dnd_days")}>
            {WEEKDAYS.map((day) => {
              const active = settings.dnd_days.includes(day);
              return (
                <Button
                  disabled={!settings.dnd_enabled}
                  key={day}
                  onClick={() => {
                    const next = active
                      ? settings.dnd_days.filter((value) => value !== day)
                      : [...settings.dnd_days, day].sort((left, right) => left - right);
                    patchScope(scope, { dnd_days: next });
                  }}
                  type="button"
                  variant={active ? "primary" : "secondary"}
                >
                  {t(`settings.dow.${String(day)}`)}
                </Button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
