import { useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { useResolvedTheme, useThemeControls } from "@/app/theme-provider";
import { useConversation, useUpdateConversationWallpaper } from "@/features/conversations/api/queries";
import { useUpdatePreferences } from "@/features/settings/api/queries";
import {
  palettePassesContrast,
  parseWallpaper,
  resolveAppearance,
  SEMANTIC_DEFAULTS,
  sliderUnit,
  wallpaperLayerStyle,
  type WallpaperPresetId,
  WALLPAPER_PRESET_IDS,
} from "@/shared/lib/theme";
import { UNIT_PERCENT } from "@/shared/lib/theme/appearance";
import { Button, Slider } from "@/shared/ui";

export function WallpaperPicker({ conversationId }: { conversationId?: number }) {
  const { t } = useTranslation();
  const { input } = useThemeControls();
  const resolved = useResolvedTheme();
  const appearance = resolveAppearance(input.appearance);
  const conversation = useConversation(conversationId ?? 0);
  const updatePreferences = useUpdatePreferences();
  const updateWallpaper = useUpdateConversationWallpaper();
  const membership = conversationId
    ? parseWallpaper(conversation.data?.wallpaper)
    : null;
  const wallpaper = membership ?? appearance.wallpaper;
  const palette = SEMANTIC_DEFAULTS[resolved];
  const [blocked, setBlocked] = useState(false);
  const previewStyle = wallpaperLayerStyle(wallpaper, appearance.reduceTransparency);

  function patchWallpaper(next: {
    blur?: number;
    dim?: number;
    preset?: WallpaperPresetId;
  }): void {
    const merged = { ...wallpaper, ...next };
    if (!palettePassesContrast(palette, merged.dim)) {
      setBlocked(true);
      return;
    }
    setBlocked(false);
    if (conversationId) {
      updateWallpaper.mutate({ id: conversationId, wallpaper: merged });
      return;
    }
    updatePreferences.mutate({ appearance: { wallpaper: merged } });
  }

  return (
    <div className="flex flex-col gap-[var(--control-gap)]" data-wallpaper-picker="">
      <p className="text-[var(--text-secondary)]">
        {conversationId ? t("wallpaper.this_chat") : t("wallpaper.title")}
      </p>
      <div
        className="chat-wallpaper min-h-[var(--space-16)] rounded-[var(--radius-lg)]"
        data-wallpaper-preview=""
        style={previewStyle as CSSProperties}
      />
      <div className="flex flex-wrap gap-[var(--space-2)]" role="group">
        {WALLPAPER_PRESET_IDS.map((preset) => (
          <Button
            key={preset}
            onClick={() => patchWallpaper({ preset })}
            size="sm"
            type="button"
            variant={wallpaper.preset === preset ? "primary" : "secondary"}
          >
            {t(`wallpaper.presets.${preset}`)}
          </Button>
        ))}
      </div>
      {conversationId ? (
        <Button
          onClick={() => {
            setBlocked(false);
            updateWallpaper.mutate({ id: conversationId, wallpaper: null });
          }}
          size="sm"
          type="button"
          variant="ghost"
        >
          {t("wallpaper.use_default")}
        </Button>
      ) : null}
      <label className="flex flex-col gap-[var(--space-1)]">
        <span>{t("wallpaper.dim")}</span>
        <Slider
          aria-label={t("wallpaper.dim")}
          max={UNIT_PERCENT}
          onValueChange={(values) => patchWallpaper({ dim: sliderUnit(values) })}
          value={[Math.round(wallpaper.dim * UNIT_PERCENT)]}
        />
      </label>
      <label className="flex flex-col gap-[var(--space-1)]">
        <span>{t("wallpaper.blur")}</span>
        <Slider
          aria-label={t("wallpaper.blur")}
          max={UNIT_PERCENT}
          onValueChange={(values) => patchWallpaper({ blur: sliderUnit(values) })}
          value={[Math.round(wallpaper.blur * UNIT_PERCENT)]}
        />
      </label>
      {blocked ? (
        <p className="text-[var(--status-danger)]">{t("wallpaper.contrast_fail")}</p>
      ) : null}
    </div>
  );
}
