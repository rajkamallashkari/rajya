import { describe, expect, it } from "vitest";
import {
  appearanceTokensFromDocument,
  asPreferenceDocument,
  deepMerge,
  mapPreferencesToTheme,
  preferenceAppearance,
  slidersFromAppearance,
} from "./map-preferences";
import type { PreferenceDocument } from "@/shared/lib/config/preferences-registry";
import preferencesRegistry from "@/shared/lib/config/preferences-registry.json";
import { ACCENT_BOOT_HEX } from "@/shared/lib/theme";

const fonts = [
  {
    id: 2,
    name: "Inter",
    font_family_value: "Inter, sans-serif",
    google_font_url: "https://fonts.googleapis.com/css2?family=Inter",
  },
];

const accents = [
  {
    id: "cyber_indigo",
    label: "Cyber Indigo",
    hex: ACCENT_BOOT_HEX,
    is_light_compatible: true,
    is_dark_compatible: true,
  },
  {
    id: "ember",
    label: "Ember",
    hex: ACCENT_BOOT_HEX,
    is_light_compatible: true,
    is_dark_compatible: true,
  },
];

describe("mapPreferencesToTheme", () => {
  it("merges overlays and maps the preference document onto applyTheme input", () => {
    expect(deepMerge({ a: { b: 1 } }, { a: { c: 2 }, d: [1] })).toEqual({
      a: { b: 1, c: 2 },
      d: [1],
    });
    const appearance = preferenceAppearance(undefined);
    expect(appearance.theme).toBe("system");
    expect(slidersFromAppearance(appearance).size).toBe(0);
    expect(appearanceTokensFromDocument(appearance).bubbleCornerStyle).toBe("rounded");
    const document = structuredClone(preferencesRegistry.defaults) as PreferenceDocument;
    document.appearance.theme = "dark";
    document.appearance.font_config_id = 2;
    document.appearance.split_accents = true;
    document.appearance.accent_dark = "ember";
    document.appearance.text_size = 3;
    const mapped = mapPreferencesToTheme(document, fonts, accents, "dark");
    expect(mapped.theme).toBe("dark");
    expect(mapped.fontFamily).toBe("Inter, sans-serif");
    expect(mapped.accentHex).toBe(ACCENT_BOOT_HEX);
    expect(mapped.sliders.size).toBe(3);
    expect(mapped.userSetsAccent).toBe(true);
    const light = mapPreferencesToTheme(document, fonts, accents, "light");
    expect(light.accentHex).toBe(ACCENT_BOOT_HEX);
    document.appearance.split_accents = false;
    expect(mapPreferencesToTheme(document, fonts, accents, "dark").userSetsAccent).toBe(true);
    expect(asPreferenceDocument(null)).toBeUndefined();
    expect(asPreferenceDocument("nope")).toBeUndefined();
    expect(asPreferenceDocument({ appearance: {} })).toEqual({ appearance: {} });
    expect(preferenceAppearance({ appearance: 1 } as unknown as PreferenceDocument).theme).toBe(
      "system",
    );
    expect(
      preferenceAppearance({ appearance: { wallpaper: "dusk" } } as unknown as PreferenceDocument)
        .wallpaper.preset,
    ).toBe(appearance.wallpaper.preset);
    const missing = mapPreferencesToTheme(undefined, [], [], "dark");
    expect(missing.fontFamily).toBe("inherit");
    expect(missing.userSetsAccent).toBe(false);
    const overlay = { "--text-primary": ACCENT_BOOT_HEX } as const;
    expect(mapPreferencesToTheme(undefined, [], [], "dark", overlay).adminOverrides).toEqual(
      overlay,
    );
  });
});
