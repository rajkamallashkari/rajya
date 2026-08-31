import { useEffect, type ReactNode } from "react";
import { useResolvedTheme, useThemeControls } from "@/app/theme-provider";
import { useAccentConfigs, useFontConfigs, usePreferences } from "@/features/settings/api/queries";
import { asPreferenceDocument, mapPreferencesToTheme } from "@/features/settings/model/map-preferences";

export function PreferencesThemeBridge({ children }: { children: ReactNode }) {
  const { setInput } = useThemeControls();
  const resolved = useResolvedTheme();
  const preferences = usePreferences();
  const fonts = useFontConfigs();
  const accents = useAccentConfigs();

  useEffect(() => {
    if (!preferences.data || !fonts.data || !accents.data) {
      return;
    }
    setInput(
      mapPreferencesToTheme(
        asPreferenceDocument(preferences.data.data),
        fonts.data.font_configs,
        accents.data.accent_configs,
        resolved,
      ),
    );
  }, [accents.data, fonts.data, preferences.data, resolved, setInput]);

  return children;
}
