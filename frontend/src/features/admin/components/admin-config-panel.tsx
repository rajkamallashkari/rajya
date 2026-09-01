import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  useAdminFeatureFlags,
  useAdminSettings,
  useAdminThemeOverrides,
  useAdminTranslationStrings,
  useResetAdminSetting,
  useResetAdminThemeOverrides,
  useResetAdminTranslationString,
  useUpdateAdminFeatureFlag,
  useUpdateAdminSetting,
  useUpdateAdminThemeOverride,
  useUpdateAdminTranslationString,
} from "@/features/admin/api/queries";
import {
  ADMIN_SURFACE_ALL,
  ADMIN_TABS,
  contrastFailurePair,
  formField,
  parseAccountIds,
  parseSettingInput,
  type AdminTabId,
} from "@/features/admin/model/config";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function AdminConfigPanel() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<AdminTabId>("settings");
  return (
    <div className="flex flex-col gap-[var(--space-6)]" data-admin-config="">
      <nav aria-label={t("admin.title")} className="flex flex-wrap gap-[var(--space-2)]">
        {ADMIN_TABS.map((id) => (
          <Button
            key={id}
            onClick={() => setTab(id)}
            type="button"
            variant={tab === id ? "primary" : "ghost"}
          >
            {t(`admin.${id}`)}
          </Button>
        ))}
      </nav>
      {tab === "settings" ? <SettingsEditor /> : null}
      {tab === "flags" ? <FlagsEditor /> : null}
      {tab === "strings" ? <StringsEditor /> : null}
      {tab === "colours" ? <ColoursEditor /> : null}
    </div>
  );
}

function SettingsEditor(): ReactNode {
  const { t } = useTranslation();
  const listed = useAdminSettings();
  const update = useUpdateAdminSetting();
  const reset = useResetAdminSetting();
  const grouped = useMemo(() => {
    const rows = listed.data?.settings ?? [];
    const map = new Map<string, typeof rows>();
    for (const row of rows) {
      const category = row.category || "general";
      const bucket = map.get(category) ?? [];
      bucket.push(row);
      map.set(category, bucket);
    }
    return [...map.entries()];
  }, [listed.data?.settings]);

  function save(event: FormEvent<HTMLFormElement>, key: string, type: string): void {
    event.preventDefault();
    const form = event.currentTarget;
    update.mutate({ key, value: parseSettingInput(type, formField(new FormData(form), "value")) });
  }

  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      {grouped.map(([category, rows]) => (
        <section className="flex flex-col gap-[var(--control-gap)]" key={category}>
          <h2 className={WEIGHT_EMPHASIS}>{t("admin.category", { name: category })}</h2>
          {rows.map((row) => (
            <form
              className="flex flex-col gap-[var(--space-2)]"
              key={row.key}
              onSubmit={(event) => save(event, row.key, String(row.type ?? "string"))}
            >
              <label className="flex flex-col gap-[var(--space-2)]">
                <span>{row.key}</span>
                <span>{row.description}</span>
                <Input
                  aria-label={row.key}
                  defaultValue={
                    typeof row.value === "string" || typeof row.value === "number"
                      ? String(row.value)
                      : JSON.stringify(row.value)
                  }
                  name="value"
                />
              </label>
              <div className="flex gap-[var(--control-gap)]">
                <Button type="submit">{t("admin.current")}</Button>
                <Button onClick={() => reset.mutate(row.key)} type="button" variant="ghost">
                  {t("admin.reset")}
                </Button>
              </div>
            </form>
          ))}
        </section>
      ))}
    </div>
  );
}

function FlagsEditor(): ReactNode {
  const { t } = useTranslation();
  const listed = useAdminFeatureFlags();
  const update = useUpdateAdminFeatureFlag();
  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      {(listed.data?.feature_flags ?? []).map((flag) => (
        <form
          className="flex flex-col gap-[var(--control-gap)]"
          key={flag.key}
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const ids = parseAccountIds(formField(data, "account_ids"));
            const percentageRaw = formField(data, "percentage");
            const percentage = percentageRaw === "" ? undefined : Number(percentageRaw);
            update.mutate({
              enabled: flag.enabled,
              key: flag.key,
              rollout: {
                account_ids: ids,
                ...(percentage === undefined || Number.isNaN(percentage) ? {} : { percentage }),
              },
            });
          }}
        >
          <label className="flex items-center justify-between gap-[var(--control-gap)]">
            <span>
              {flag.key}
              <span className="block">{flag.description}</span>
              <span>
                {t("admin.code_default")}: {String(flag.default)}
              </span>
            </span>
            <Switch
              aria-label={flag.key}
              checked={flag.enabled}
              onCheckedChange={(enabled) =>
                update.mutate({
                  enabled,
                  key: flag.key,
                  rollout: flag.rollout ?? {},
                })
              }
            />
          </label>
          <Input
            aria-label={t("admin.account_ids")}
            defaultValue={
              Array.isArray((flag.rollout as { account_ids?: number[] } | undefined)?.account_ids)
                ? (flag.rollout as { account_ids: number[] }).account_ids.join(", ")
                : ""
            }
            name="account_ids"
          />
          <Input
            aria-label={t("admin.percentage")}
            defaultValue={String(
              (flag.rollout as { percentage?: number } | undefined)?.percentage ?? "",
            )}
            name="percentage"
          />
          <Button type="submit">{t("admin.current")}</Button>
        </form>
      ))}
    </div>
  );
}

function StringsEditor(): ReactNode {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [surface, setSurface] = useState("");
  const listed = useAdminTranslationStrings({ q: q || undefined, surface: surface || undefined });
  const update = useUpdateAdminTranslationString();
  const reset = useResetAdminTranslationString();
  const surfaces = useMemo(() => {
    const values = new Set(
      (listed.data?.translation_strings ?? []).map((row) => row.surface).filter(Boolean),
    );
    return [...values];
  }, [listed.data?.translation_strings]);

  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      <Input
        aria-label={t("admin.search")}
        onChange={(event) => setQ(event.target.value)}
        value={q}
      />
      <label className="flex flex-col gap-[var(--space-2)]">
        <span>{t("admin.surface")}</span>
        <Select
          onValueChange={(value) => setSurface(value === ADMIN_SURFACE_ALL ? "" : value)}
          value={surface || ADMIN_SURFACE_ALL}
        >
          <SelectTrigger aria-label={t("admin.surface")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ADMIN_SURFACE_ALL}>{t("admin.surface_all")}</SelectItem>
            {surfaces.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setSurface(surfaces[0] ?? "")} type="button" variant="ghost">
          {t("admin.used_on_screen")}
        </Button>
      </label>
      {(listed.data?.translation_strings ?? []).map((row) => (
        <form
          className="flex flex-col gap-[var(--space-2)]"
          key={row.key}
          onSubmit={(event) => {
            event.preventDefault();
            const value = formField(new FormData(event.currentTarget), "value");
            update.mutate({ key: row.key, value });
          }}
        >
          <span>{row.key}</span>
          <span>
            {t("admin.code_default")}: {row.default}
          </span>
          <Textarea aria-label={row.key} defaultValue={row.value} name="value" />
          <div className="flex gap-[var(--control-gap)]">
            <Button type="submit">{t("admin.current")}</Button>
            <Button onClick={() => reset.mutate(row.key)} type="button" variant="ghost">
              {t("admin.reset_string")}
            </Button>
          </div>
        </form>
      ))}
    </div>
  );
}

function ColoursEditor(): ReactNode {
  const { t } = useTranslation();
  const listed = useAdminThemeOverrides();
  const update = useUpdateAdminThemeOverride();
  const reset = useResetAdminThemeOverrides();
  const themes = listed.data?.themes ?? {};
  const pair = contrastFailurePair(update.error);

  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      <Button onClick={() => reset.mutate({})} type="button">
        {t("admin.reset_all")}
      </Button>
      {Object.entries(themes).map(([theme, tokens]) => (
        <section className="flex flex-col gap-[var(--control-gap)]" key={theme}>
          <h2 className={WEIGHT_EMPHASIS}>{theme}</h2>
          {(tokens ?? []).map((token) => (
            <form
              className="flex flex-col gap-[var(--space-2)]"
              key={`${theme}-${token.token_name}`}
              onSubmit={(event) => {
                event.preventDefault();
                const value = formField(new FormData(event.currentTarget), "value");
                update.mutate({ theme, tokenName: token.token_name, value });
              }}
            >
              <label className="flex flex-col gap-[var(--space-2)]">
                <span>{token.token_name}</span>
                <Input
                  aria-label={`${theme} ${token.token_name}`}
                  defaultValue={token.value}
                  name="value"
                />
              </label>
              <div className="flex gap-[var(--control-gap)]">
                <Button type="submit">{t("admin.current")}</Button>
                <Button
                  onClick={() => reset.mutate({ theme, tokenName: token.token_name })}
                  type="button"
                  variant="ghost"
                >
                  {t("admin.reset")}
                </Button>
              </div>
            </form>
          ))}
        </section>
      ))}
      {pair ? <p>{t("admin.contrast_failed", pair)}</p> : null}
    </div>
  );
}
