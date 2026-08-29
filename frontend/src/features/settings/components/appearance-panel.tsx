import { useTranslation } from "react-i18next";
import { useThemeControls } from "@/app/theme-provider";
import {
  AUTOPLAY_POLICIES,
  CORNER_STYLES,
  DEFAULT_APPEARANCE,
  firstValue,
  resolveAppearance,
  SKIN_TONE_MAX,
  SKIN_TONE_MIN,
  type BubbleCornerStyle,
  type MediaAutoplay,
} from "@/shared/lib/theme/appearance";
import { Button, Slider, Switch } from "@/shared/ui";

export function AppearancePanel() {
  const { t } = useTranslation();
  const { input, setInput } = useThemeControls();
  const appearance = resolveAppearance(input.appearance);

  function patch(
    next: Partial<{
      alwaysShowTimestamps: boolean;
      bubbleCornerStyle: BubbleCornerStyle;
      emojiSkinTone: number;
      mediaAutoplay: MediaAutoplay;
      reduceTransparency: boolean;
    }>,
  ): void {
    setInput({
      appearance: {
        ...DEFAULT_APPEARANCE,
        ...appearance,
        ...next,
        wallpaper: appearance.wallpaper,
      },
    });
  }

  return (
    <div className="flex flex-col gap-[var(--control-gap)]" data-appearance-panel="">
      <div
        className="flex flex-wrap gap-[var(--space-2)]"
        role="group"
        aria-label={t("appearance.corners")}
      >
        {CORNER_STYLES.map((style) => (
          <Button
            key={style}
            onClick={() => patch({ bubbleCornerStyle: style })}
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
          onCheckedChange={(checked) => patch({ alwaysShowTimestamps: checked })}
        />
      </label>
      <label className="flex min-h-[var(--control-height)] items-center justify-between gap-[var(--control-gap)]">
        <span>{t("appearance.reduce_transparency")}</span>
        <Switch
          aria-label={t("appearance.reduce_transparency")}
          checked={appearance.reduceTransparency}
          onCheckedChange={(checked) => patch({ reduceTransparency: checked })}
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
            onClick={() => patch({ mediaAutoplay: policy })}
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
          onValueChange={(values) => patch({ emojiSkinTone: firstValue(values, SKIN_TONE_MIN) })}
          value={[appearance.emojiSkinTone]}
        />
      </label>
    </div>
  );
}
