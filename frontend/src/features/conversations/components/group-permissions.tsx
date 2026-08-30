import { useTranslation } from "react-i18next";
import { useUpdateConversation } from "@/features/conversations/api/queries";
import type { Conversation } from "@/features/conversations/api/http";
import { SLOW_MODE_PRESETS } from "@/features/conversations/model/settings";
import {
  MEMBER_PERMISSION_KEYS,
  PERMISSION_ROLES,
  minRoleFor,
  type MemberPermissionKey,
  type PermissionRole,
} from "@/features/conversations/model/permissions";
import { Button, Switch } from "@/shared/ui";

export function GroupPermissions({ conversation }: { conversation: Conversation }) {
  const { t } = useTranslation();
  const update = useUpdateConversation();
  const document = conversation.member_permissions;

  function setRole(key: MemberPermissionKey, role: PermissionRole): void {
    update.mutate({
      id: conversation.id,
      member_permissions: { ...document, [key]: role },
    });
  }

  return (
    <div
      className="flex flex-col gap-[var(--space-4)] px-[var(--space-list-x)]"
      data-group-permissions=""
    >
      <p className="[font-weight:var(--font-weight-emphasis)]">
        {t("conversations.permissions.title")}
      </p>
      {MEMBER_PERMISSION_KEYS.map((key) => {
        const current = minRoleFor(document, key);
        return (
          <div className="flex flex-col gap-[var(--space-2)]" key={key}>
            <p className="text-[var(--text-secondary)]">{t(`conversations.permissions.${key}`)}</p>
            <div className="flex flex-wrap gap-[var(--space-2)]" role="group">
              {PERMISSION_ROLES.map((role) => (
                <Button
                  key={role}
                  onClick={() => setRole(key, role)}
                  size="sm"
                  type="button"
                  variant={current === role ? "primary" : "secondary"}
                >
                  {t(`conversations.permissions.${role}`)}
                </Button>
              ))}
            </div>
          </div>
        );
      })}
      <p className="[font-weight:var(--font-weight-emphasis)]">
        {t("conversations.slow_mode.title")}
      </p>
      <div className="flex flex-wrap gap-[var(--space-2)]" role="group">
        {SLOW_MODE_PRESETS.map((seconds) => (
          <Button
            key={seconds}
            onClick={() => update.mutate({ id: conversation.id, slow_mode_seconds: seconds })}
            size="sm"
            type="button"
            variant={conversation.slow_mode_seconds === seconds ? "primary" : "secondary"}
          >
            {seconds === 0
              ? t("conversations.slow_mode.off")
              : t("conversations.slow_mode.seconds", { count: seconds })}
          </Button>
        ))}
      </div>
      <label className="flex min-h-[var(--control-height)] items-center justify-between gap-[var(--control-gap)]">
        <span>{t("conversations.restrict_forwarding")}</span>
        <Switch
          aria-label={t("conversations.restrict_forwarding")}
          checked={Boolean(conversation.restrict_forwarding)}
          onCheckedChange={(checked) =>
            update.mutate({ id: conversation.id, restrict_forwarding: checked })
          }
        />
      </label>
    </div>
  );
}
