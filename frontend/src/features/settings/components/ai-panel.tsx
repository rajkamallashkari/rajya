import { useTranslation } from "react-i18next";
import { StyleProfileConsent } from "@/features/bots/components/style-profile-consent";
import { usePreferences, useUpdatePreferences } from "@/features/settings/api/queries";
import { asPreferenceDocument, preferenceAi } from "@/features/settings/model/map-preferences";
import preferencesRegistry from "@/shared/lib/config/preferences-registry.json";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui";

const LANGUAGES = preferencesRegistry.fields["ai.translation_language"].values as string[];

export function AiPanel() {
  const { t } = useTranslation();
  const preferences = usePreferences();
  const update = useUpdatePreferences();
  const ai = preferenceAi(asPreferenceDocument(preferences.data?.data));

  return (
    <div className="flex flex-col gap-[var(--space-6)]" data-ai-panel="">
      <label className="flex flex-col gap-[var(--space-1)]">
        <span>{t("settings.translation_language")}</span>
        <Select
          onValueChange={(value) => update.mutate({ ai: { translation_language: value } })}
          value={ai.translation_language}
        >
          <SelectTrigger aria-label={t("settings.translation_language")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((code) => (
              <SelectItem key={code} value={code}>
                {code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <StyleProfileConsent />
    </div>
  );
}
