import { useEffect, type ReactNode } from "react";
import { useResolvedTheme, useThemeControls } from "@/app/theme-provider";
import { useAccentConfigs, useFontConfigs, usePreferences } from "@/features/settings/api/queries";
import { useThemeOverridePalette } from "@/features/admin";
import {
  asPreferenceDocument,
  mapPreferencesToTheme,
} from "@/features/settings/model/map-preferences";
import type { SemanticOverrides } from "@/shared/lib/theme";

export function PreferencesThemeBridge({ children }: { children: ReactNode }) {
  const { setInput } = useThemeControls();
  const resolved = useResolvedTheme();
  const preferences = usePreferences();
  const fonts = useFontConfigs();
  const accents = useAccentConfigs();
  const palettes = useThemeOverridePalette();

  useEffect(() => {
    if (!preferences.data || !fonts.data || !accents.data || !palettes.data) {
      return;
    }
    const overlay = palettes.data[resolved] as SemanticOverrides;
    setInput(
      mapPreferencesToTheme(
        asPreferenceDocument(preferences.data.data),
        fonts.data.font_configs,
        accents.data.accent_configs,
        resolved,
        overlay,
      ),
    );
  }, [accents.data, fonts.data, palettes.data, preferences.data, resolved, setInput]);

  return children;
}
