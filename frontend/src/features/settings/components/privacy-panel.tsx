import { useTranslation } from "react-i18next";
import { PreferenceSwitch } from "@/features/settings/components/preference-switch";
import {
  useBlocks,
  usePreferences,
  useUnblock,
  useUpdatePreferences,
} from "@/features/settings/api/queries";
import { asPreferenceDocument, preferencePrivacy } from "@/features/settings/model/map-preferences";
import { queryListStatus } from "@/features/settings/model/map-sessions";
import type { PreferencePrivacy } from "@/shared/lib/config/preferences-registry";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";
import { Button, ListView } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

const PRIVACY_FLAGS: (keyof PreferencePrivacy)[] = [
  "read_receipts",
  "last_active",
  "discoverable_by_username",
  "discoverable_by_email",
  "discoverable_by_phone",
  "show_email_on_profile",
  "show_phone_on_profile",
];

export function PrivacyPanel() {
  const { t } = useTranslation();
  const preferences = usePreferences();
  const update = useUpdatePreferences();
  const blocks = useBlocks();
  const unblock = useUnblock();
  const pushLayer = useLayerStore((state) => state.pushLayer);
  const privacy = preferencePrivacy(asPreferenceDocument(preferences.data?.data));
  const rows = blocks.data?.blocks ?? [];

  return (
    <div className="flex flex-col gap-[var(--space-6)]" data-privacy-panel="">
      <section className="flex flex-col gap-[var(--control-gap)]">
        {PRIVACY_FLAGS.map((flag) => (
          <PreferenceSwitch
            checked={privacy[flag]}
            key={flag}
            label={t(`settings.privacy_${flag}`)}
            onCheckedChange={(checked) => update.mutate({ privacy: { [flag]: checked } })}
          />
        ))}
      </section>
      <section className="flex flex-col gap-[var(--control-gap)]">
        <h2 className={WEIGHT_EMPHASIS}>{t("settings.privacy_blocked")}</h2>
        <ListView
          onRetry={() => {
            void blocks.refetch();
          }}
          status={queryListStatus(blocks.isPending, blocks.isError, rows.length === 0)}
        >
          <ul className="flex flex-col gap-[var(--control-gap)]">
            {rows.map((row) => (
              <li
                className="flex items-center justify-between gap-[var(--control-gap)]"
                key={row.account.id}
              >
                <Button
                  className="min-w-0 justify-start truncate"
                  onClick={() =>
                    pushLayer({
                      accountId: String(row.account.id),
                      conversationId: "0",
                      id: `account:${String(row.account.id)}`,
                      kind: "profile",
                      title: row.account.display_name,
                    })
                  }
                  type="button"
                  variant="ghost"
                >
                  {row.account.display_name}
                </Button>
                <Button
                  onClick={() => unblock.mutate(row.account.id)}
                  type="button"
                  variant="secondary"
                >
                  {t("settings.privacy_unblock")}
                </Button>
              </li>
            ))}
          </ul>
        </ListView>
      </section>
    </div>
  );
}
