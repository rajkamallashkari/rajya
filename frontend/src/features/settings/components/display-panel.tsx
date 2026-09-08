import { useTranslation } from "react-i18next";
import { AppearancePanel } from "@/features/settings/components/appearance-panel";
import { WallpaperPicker } from "@/features/settings/components/wallpaper-picker";
import { usePreferences, useUpdatePreferences } from "@/features/settings/api/queries";
import { asPreferenceDocument, preferenceLocale } from "@/features/settings/model/map-preferences";
import type { PreferenceLocale } from "@/shared/lib/config/preferences-registry";
import preferencesRegistry from "@/shared/lib/config/preferences-registry.json";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

const DATE_FORMATS = preferencesRegistry.fields["locale.date_format"].values as PreferenceLocale["date_format"][];
const TIME_FORMATS = preferencesRegistry.fields["locale.time_format"].values as PreferenceLocale["time_format"][];

export function DisplayPanel() {
  return (
    <>
      <AppearancePanel />
      <WallpaperPicker />
      <LocalePanel />
    </>
  );
}

export function LocalePanel() {
  const { t } = useTranslation();
  const preferences = usePreferences();
  const update = useUpdatePreferences();
  const locale = preferenceLocale(asPreferenceDocument(preferences.data?.data));

  return (
    <section className="flex flex-col gap-[var(--control-gap)]" data-locale-panel="">
      <h2 className={WEIGHT_EMPHASIS}>{t("settings.locale")}</h2>
      <label className="flex flex-col gap-[var(--space-1)]">
        <span>{t("settings.locale_date")}</span>
        <Select
          onValueChange={(value) =>
            update.mutate({ locale: { date_format: value as PreferenceLocale["date_format"] } })
          }
          value={locale.date_format}
        >
          <SelectTrigger aria-label={t("settings.locale_date")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_FORMATS.map((format) => (
              <SelectItem key={format} value={format}>
                {format}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <div className="flex flex-wrap gap-[var(--space-2)]" role="group" aria-label={t("settings.locale_time")}>
        {TIME_FORMATS.map((format) => (
          <Button
            key={format}
            onClick={() => update.mutate({ locale: { time_format: format } })}
            type="button"
            variant={locale.time_format === format ? "primary" : "secondary"}
          >
            {t(`settings.locale_time_${format}`)}
          </Button>
        ))}
      </div>
      <label className="flex flex-col gap-[var(--space-1)]">
        <span>{t("settings.locale_timezone")}</span>
        <Input
          aria-label={t("settings.locale_timezone")}
          onChange={(event) => update.mutate({ locale: { timezone: event.target.value } })}
          value={locale.timezone}
        />
      </label>
    </section>
  );
}
