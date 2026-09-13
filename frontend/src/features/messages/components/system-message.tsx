import { useTranslation } from "react-i18next";
import type { SystemEventKey } from "@/features/messages/model/constants";

interface PermissionChange {
  new_value: string;
  permission: string;
  previous_value: string;
}

interface PermissionMetadata {
  changes?: PermissionChange[];
  name?: string;
}

export function permissionMetadata(value: unknown): PermissionMetadata {
  return value && typeof value === "object" ? (value as PermissionMetadata) : {};
}

export function SystemMessage({
  eventKey,
  text,
  values,
}: {
  eventKey: SystemEventKey;
  text?: string | null;
  values?: Record<string, string | number>;
}) {
  const { t } = useTranslation();
  return (
    <p
      className="px-[var(--space-4)] py-[var(--space-3)] text-center text-[length:var(--text-sm)] text-[var(--text-tertiary)]"
      data-system-message={eventKey}
    >
      {text ?? t(`messages.system.${eventKey}`, values)}
    </p>
  );
}

export function PermissionSystemMessage({
  body,
  metadata: metadataValue,
}: {
  body?: string | null;
  metadata?: unknown;
}) {
  const { t } = useTranslation();
  const metadata = permissionMetadata(metadataValue);
  const changes = Array.isArray(metadata.changes) ? metadata.changes : [];
  if (!metadata.name || changes.length === 0) {
    return <SystemMessage eventKey="permissions_changed" text={body} />;
  }

  return (
    <section
      aria-label={body ?? t("messages.system.permissions_changed")}
      className="mx-auto my-[var(--space-2)] max-w-[min(90%,var(--space-80))] rounded-[var(--radius-md)] bg-[var(--surface-muted)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--text-sm)]"
      data-system-message="permissions_changed"
    >
      <p className="text-center text-[var(--text-secondary)]">
        {t("messages.system.permissions_changed_by", { name: metadata.name })}
      </p>
      <ul className="mt-[var(--space-2)] flex flex-col gap-[var(--space-1)]">
        {changes.map((change) => (
          <li
            className="flex flex-wrap items-baseline justify-center gap-x-[var(--space-2)] text-center"
            key={change.permission}
          >
            <span className="[font-weight:var(--font-weight-emphasis)]">
              {t(`conversations.permissions.${change.permission}`)}
            </span>
            <span className="text-[var(--text-tertiary)]">
              {t(`conversations.permissions.${change.previous_value}`)}
              {" → "}
              {t(`conversations.permissions.${change.new_value}`)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
