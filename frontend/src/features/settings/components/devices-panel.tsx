import { useTranslation } from "react-i18next";
import {
  useDeviceSessions,
  useRevokeDeviceSession,
  useRevokeOtherDeviceSessions,
} from "@/features/settings/api/queries";
import { SessionListItem } from "@/features/settings/components/session-list-item";
import {
  canRevokeOtherSessions,
  mapDeviceSession,
  queryListStatus,
} from "@/features/settings/model/map-sessions";
import { Button, ListView } from "@/shared/ui";

export function DevicesPanel() {
  const { t } = useTranslation();
  const sessions = useDeviceSessions();
  const revoke = useRevokeDeviceSession();
  const revokeOthers = useRevokeOtherDeviceSessions();
  const rows = sessions.data?.sessions ?? [];
  return (
    <div className="flex flex-col gap-[var(--control-gap)]" data-devices-panel="">
      {canRevokeOtherSessions(rows) ? (
        <Button
          onClick={() => revokeOthers.mutate()}
          type="button"
          variant="danger"
        >
          {t("sessions.revoke_others")}
        </Button>
      ) : null}
      <ListView
        onRetry={() => {
          void sessions.refetch();
        }}
        status={queryListStatus(sessions.isPending, sessions.isError, rows.length === 0)}
      >
        <ul className="flex flex-col">
          {rows.map((session) => (
            <li key={session.id}>
              <SessionListItem
                onRevoke={(id) => revoke.mutate(Number(id))}
                session={mapDeviceSession(session)}
              />
            </li>
          ))}
        </ul>
      </ListView>
    </div>
  );
}
