import { type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  useAdminPromptTemplates,
  useUpdateAdminPromptTemplate,
} from "@/features/admin/api/queries";
import { formField } from "@/features/admin/model/config";
import { queryListStatus } from "@/features/admin/model/display";
import { Button, ListView, Textarea } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function AdminPromptsPanel(): ReactNode {
  const { t } = useTranslation();
  const listed = useAdminPromptTemplates();
  const update = useUpdateAdminPromptTemplate();
  const rows = listed.data?.prompt_templates ?? [];

  function save(event: FormEvent<HTMLFormElement>, capability: string): void {
    event.preventDefault();
    update.mutate({
      capability,
      template: formField(new FormData(event.currentTarget), "template"),
    });
  }

  return (
    <div className="flex flex-col gap-[var(--space-6)]" data-admin-prompts="">
      <h1 className={WEIGHT_EMPHASIS}>{t("admin.prompts")}</h1>
      <ListView
        onRetry={() => void listed.refetch()}
        status={queryListStatus(listed.isPending, listed.isError, rows.length === 0)}
      >
        {rows.map((row) => (
          <form
            className="flex flex-col gap-[var(--space-2)]"
            key={row.capability}
            onSubmit={(event) => save(event, row.capability)}
          >
            <label className="flex flex-col gap-[var(--space-2)]">
              <span className={WEIGHT_EMPHASIS}>{row.capability}</span>
              <span>
                {t("admin.version", { version: row.version ?? 0 })} · {t("admin.code_default")}
              </span>
              <Textarea aria-label={row.capability} defaultValue={row.template} name="template" />
            </label>
            <Button type="submit">{t("admin.current")}</Button>
          </form>
        ))}
      </ListView>
    </div>
  );
}
