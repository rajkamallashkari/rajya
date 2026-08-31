import { useTranslation } from "react-i18next";
import { useBuildStyleProfile, useStyleProfile, useUpdateStyleConsent } from "@/features/bots/api/queries";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";

export function StyleProfileConsent() {
  const { t } = useTranslation();
  const profile = useStyleProfile();
  const consent = useUpdateStyleConsent();
  const build = useBuildStyleProfile();
  const enabled = Boolean(profile.data?.enabled);
  return (
    <div className="flex flex-col gap-[var(--space-3)]" data-style-profile-consent="">
      <p className="[font-weight:var(--font-weight-emphasis)]">{t("bots.style")}</p>
      <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">
        {t("ai.consent_hint")}
      </p>
      <label className="flex items-center justify-between gap-[var(--space-3)]">
        <span>{t("ai.consent")}</span>
        <Switch
          checked={enabled}
          disabled={profile.isPending || consent.isPending}
          onCheckedChange={(next) => consent.mutate(next)}
        />
      </label>
      {enabled ? (
        <Button
          disabled={build.isPending}
          onClick={() => build.mutate()}
          type="button"
          variant="secondary"
        >
          {t("ai.build_style")}
        </Button>
      ) : null}
      {build.isError ? (
        <p className="text-[length:var(--text-sm)] text-[var(--status-danger)]">
          {t("ai.style_failed")}
        </p>
      ) : null}
      {profile.data?.profile ? (
        <p className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">{profile.data.profile}</p>
      ) : null}
    </div>
  );
}
