import { useTranslation } from "react-i18next";
import { useResolvedTheme, useThemeControls } from "@/app/theme-provider";
import { DEFAULT_QUICK_REACTIONS } from "@/features/messages/model/menu";
import { useAccentConfigs, useFontConfigs, usePreferences, useUpdatePreferences } from "@/features/settings/api/queries";
import { asPreferenceDocument, preferenceAppearance } from "@/features/settings/model/map-preferences";
import {
  AUTOPLAY_POLICIES,
  CORNER_STYLES,
  DENSITY_VALUES,
  firstValue,
  resolveAppearance,
  SKIN_TONE_MAX,
  SKIN_TONE_MIN,
  THEME_VALUES,
  TYPOGRAPHY,
  type BubbleCornerStyle,
  type Density,
  type MediaAutoplay,
} from "@/shared/lib/theme";
import { Button, Slider, Switch } from "@/shared/ui";

function sixReactions(values: string[] | undefined): string[] {
  const source = values ?? DEFAULT_QUICK_REACTIONS;
  return DEFAULT_QUICK_REACTIONS.map((fallback, index) => source[index] ?? fallback);
}

export function AppearancePanel() {
  const { t } = useTranslation();
  const { input } = useThemeControls();
  const resolved = useResolvedTheme();
  const appearance = resolveAppearance(input.appearance);
  const preferences = usePreferences();
  const fonts = useFontConfigs();
  const accents = useAccentConfigs();
  const update = useUpdatePreferences();
  const document = asPreferenceDocument(preferences.data?.data);
  const documentAppearance = preferenceAppearance(document);
  const reactions = sixReactions(document?.chat?.quick_reactions);
  const fontConfigs = fonts.data?.font_configs ?? [];
  const accentConfigs = accents.data?.accent_configs ?? [];
  const selectedAccentId = documentAppearance.split_accents
    ? resolved === "light"
      ? documentAppearance.accent_light
      : documentAppearance.accent_dark
    : documentAppearance.accent_light;

  function persist(overlay: Record<string, unknown>): void {
    update.mutate(overlay);
  }

  function patchTokens(
    next: Partial<{
      alwaysShowTimestamps: boolean;
      bubbleCornerStyle: BubbleCornerStyle;
      emojiSkinTone: number;
      mediaAutoplay: MediaAutoplay;
      reduceTransparency: boolean;
    }>,
  ): void {
    persist({
      appearance: {
        always_show_timestamps: next.alwaysShowTimestamps ?? appearance.alwaysShowTimestamps,
        bubble_corner_style: next.bubbleCornerStyle ?? appearance.bubbleCornerStyle,
        emoji_skin_tone: next.emojiSkinTone ?? appearance.emojiSkinTone,
        media_autoplay: next.mediaAutoplay ?? appearance.mediaAutoplay,
        reduce_transparency: next.reduceTransparency ?? appearance.reduceTransparency,
      },
    });
  }

  return (
    <div className="flex flex-col gap-[var(--control-gap)]" data-appearance-panel="">
      <div
        className="flex flex-wrap gap-[var(--space-2)]"
        role="group"
        aria-label={t("appearance.theme")}
      >
        {THEME_VALUES.map((theme) => (
          <Button
            key={theme}
            onClick={() => persist({ appearance: { theme } })}
            size="sm"
            type="button"
            variant={input.theme === theme ? "primary" : "secondary"}
          >
            {t(`appearance.theme_option.${theme}`)}
          </Button>
        ))}
      </div>
      <label className="flex min-h-[var(--control-height)] items-center justify-between gap-[var(--control-gap)]">
        <span>{t("appearance.split_accents")}</span>
        <Switch
          aria-label={t("appearance.split_accents")}
          checked={documentAppearance.split_accents}
          onCheckedChange={(checked) => persist({ appearance: { split_accents: checked } })}
        />
      </label>
      {accentConfigs.length > 0 ? (
        <div
          className="flex flex-wrap gap-[var(--space-2)]"
          role="group"
          aria-label={
            documentAppearance.split_accents
              ? resolved === "light"
                ? t("appearance.accent_light")
                : t("appearance.accent_dark")
              : t("appearance.accent")
          }
        >
          {accentConfigs.map((accent) => (
            <Button
              key={accent.id}
              onClick={() => {
                const patch = documentAppearance.split_accents
                  ? resolved === "light"
                    ? { accent_light: accent.id }
                    : { accent_dark: accent.id }
                  : { accent_light: accent.id, accent_dark: accent.id };
                persist({ appearance: patch });
              }}
              size="sm"
              style={{ backgroundColor: accent.hex }}
              type="button"
              variant={selectedAccentId === accent.id ? "primary" : "secondary"}
            >
              {accent.label}
            </Button>
          ))}
        </div>
      ) : null}
      {fontConfigs.length > 0 ? (
        <div
          className="flex flex-wrap gap-[var(--space-2)]"
          role="group"
          aria-label={t("appearance.font")}
        >
          {fontConfigs.map((font) => (
            <Button
              key={font.id}
              onClick={() =>
                persist({ appearance: { font_config_id: font.id } })
              }
              size="sm"
              type="button"
              variant={documentAppearance.font_config_id === font.id ? "primary" : "secondary"}
            >
              {font.name}
            </Button>
          ))}
        </div>
      ) : null}
      <div
        className="rounded-[var(--radius-bubble)] bg-[var(--bubble-sent-bg)] px-[var(--space-3)] py-[var(--space-2)] text-[length:calc(var(--text-md)*var(--app-size-multiplier))] [font-weight:var(--app-font-weight)] [letter-spacing:var(--app-letter-spacing)] [line-height:var(--app-line-height)]"
        data-typography-preview=""
      >
        {t("appearance.typography_preview")}
      </div>
      <label className="flex flex-col gap-[var(--space-1)]">
        <span>{t("appearance.text_size")}</span>
        <Slider
          aria-label={t("appearance.text_size")}
          max={TYPOGRAPHY.sliderMax}
          min={TYPOGRAPHY.sliderMin}
          onValueChange={(values) => {
            const size = firstValue(values, 0);
            persist({ appearance: { text_size: size } });
          }}
          value={[input.sliders.size]}
        />
      </label>
      <label className="flex flex-col gap-[var(--space-1)]">
        <span>{t("appearance.text_weight")}</span>
        <Slider
          aria-label={t("appearance.text_weight")}
          max={TYPOGRAPHY.sliderMax}
          min={TYPOGRAPHY.sliderMin}
          onValueChange={(values) => {
            const weight = firstValue(values, 0);
            persist({ appearance: { text_weight: weight } });
          }}
          value={[input.sliders.weight]}
        />
      </label>
      <label className="flex flex-col gap-[var(--space-1)]">
        <span>{t("appearance.text_line_height")}</span>
        <Slider
          aria-label={t("appearance.text_line_height")}
          max={TYPOGRAPHY.sliderMax}
          min={TYPOGRAPHY.sliderMin}
          onValueChange={(values) => {
            const lineHeight = firstValue(values, 0);
            persist({ appearance: { text_line_height: lineHeight } });
          }}
          value={[input.sliders.lineHeight]}
        />
      </label>
      <label className="flex flex-col gap-[var(--space-1)]">
        <span>{t("appearance.text_letter_spacing")}</span>
        <Slider
          aria-label={t("appearance.text_letter_spacing")}
          max={TYPOGRAPHY.sliderMax}
          min={TYPOGRAPHY.sliderMin}
          onValueChange={(values) => {
            const letterSpacing = firstValue(values, 0);
            persist({ appearance: { text_letter_spacing: letterSpacing } });
          }}
          value={[input.sliders.letterSpacing]}
        />
      </label>
      <div
        className="flex flex-wrap gap-[var(--space-2)]"
        role="group"
        aria-label={t("appearance.density")}
      >
        {DENSITY_VALUES.map((density: Density) => (
          <Button
            key={density}
            onClick={() => persist({ appearance: { density } })}
            size="sm"
            type="button"
            variant={input.density === density ? "primary" : "secondary"}
          >
            {t(`appearance.density_option.${density}`)}
          </Button>
        ))}
      </div>
      <div
        className="flex flex-wrap gap-[var(--space-2)]"
        role="group"
        aria-label={t("appearance.corners")}
      >
        {CORNER_STYLES.map((style) => (
          <Button
            key={style}
            onClick={() => patchTokens({ bubbleCornerStyle: style })}
            size="sm"
            type="button"
            variant={appearance.bubbleCornerStyle === style ? "primary" : "secondary"}
          >
            {t(`appearance.corner.${style}`)}
          </Button>
        ))}
      </div>
      <label className="flex min-h-[var(--control-height)] items-center justify-between gap-[var(--control-gap)]">
        <span>{t("appearance.timestamps")}</span>
        <Switch
          aria-label={t("appearance.timestamps")}
          checked={appearance.alwaysShowTimestamps}
          onCheckedChange={(checked) => patchTokens({ alwaysShowTimestamps: checked })}
        />
      </label>
      <label className="flex min-h-[var(--control-height)] items-center justify-between gap-[var(--control-gap)]">
        <span>{t("appearance.reduce_transparency")}</span>
        <Switch
          aria-label={t("appearance.reduce_transparency")}
          checked={appearance.reduceTransparency}
          onCheckedChange={(checked) => patchTokens({ reduceTransparency: checked })}
        />
      </label>
      <div
        className="flex flex-wrap gap-[var(--space-2)]"
        role="group"
        aria-label={t("appearance.autoplay")}
      >
        {AUTOPLAY_POLICIES.map((policy) => (
          <Button
            key={policy}
            onClick={() => patchTokens({ mediaAutoplay: policy })}
            size="sm"
            type="button"
            variant={appearance.mediaAutoplay === policy ? "primary" : "secondary"}
          >
            {t(`appearance.autoplay_policy.${policy}`)}
          </Button>
        ))}
      </div>
      <label className="flex flex-col gap-[var(--space-1)]">
        <span>{t("appearance.skin_tone")}</span>
        <Slider
          aria-label={t("appearance.skin_tone")}
          max={SKIN_TONE_MAX}
          min={SKIN_TONE_MIN}
          onValueChange={(values) =>
            patchTokens({ emojiSkinTone: firstValue(values, SKIN_TONE_MIN) })
          }
          value={[appearance.emojiSkinTone]}
        />
      </label>
      <div
        className="flex flex-wrap gap-[var(--space-2)]"
        role="group"
        aria-label={t("settings.quick_reactions")}
      >
        {reactions.map((emoji, index) => (
          <label className="flex flex-col gap-[var(--space-1)]" key={`reaction-${String(index)}`}>
            <span className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
              {t("settings.quick_reaction_slot", { n: index + 1 })}
            </span>
            <input
              aria-label={t("settings.quick_reaction_slot", { n: index + 1 })}
              className="h-[var(--control-height)] w-[var(--space-12)] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-input)] text-center"
              maxLength={8}
              onChange={(event) => {
                const next = [...reactions];
                next[index] = event.target.value;
                persist({ chat: { quick_reactions: next } });
              }}
              value={emoji}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
