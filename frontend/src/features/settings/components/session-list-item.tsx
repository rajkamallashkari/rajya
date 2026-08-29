import { Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SessionView } from "@/features/conversations/model/report";
import { Badge, Button } from "@/shared/ui";
import { ICON_CLASS, WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function SessionListItem({
  locale = "en",
  onRevoke,
  session,
}: {
  locale?: string;
  onRevoke?: (id: string) => void;
  session: SessionView;
}) {
  const { t } = useTranslation();
  const label = session.deviceLabel?.trim() ? session.deviceLabel : t("sessions.unknown_device");
  const lastSeen = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(session.lastSeenAt));
  return (
    <article
      className="flex min-h-[var(--control-height)] items-center gap-[var(--control-gap)] px-[var(--space-list-x)] py-[var(--space-list-y)]"
      data-session-current={session.current ? "true" : "false"}
      data-session-revoked={session.revoked ? "true" : "false"}
    >
      <Monitor aria-hidden="true" className={ICON_CLASS} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-[var(--space-2)]">
          <p className={WEIGHT_EMPHASIS}>{label}</p>
          {session.current ? <Badge>{t("sessions.current")}</Badge> : null}
        </div>
        <p className="text-[var(--text-secondary)]">
          {t("sessions.last_seen", { when: lastSeen })}
        </p>
        {session.userAgent ? (
          <p className="truncate text-[var(--text-tertiary)]">{session.userAgent}</p>
        ) : null}
        {session.ip ? (
          <p className="text-[var(--text-tertiary)]">{t("sessions.ip", { ip: session.ip })}</p>
        ) : null}
      </div>
      {session.revoked || session.current || !onRevoke ? null : (
        <Button onClick={() => onRevoke(session.id)} type="button" variant="danger">
          {t("sessions.revoke")}
        </Button>
      )}
    </article>
  );
}
