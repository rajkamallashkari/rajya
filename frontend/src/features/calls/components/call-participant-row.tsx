import { MicStatusIcon, type MicStatus } from "@/features/calls/components/mic-status-icon";
import { Avatar } from "@/shared/ui/avatar";

export function CallParticipantRow({
  micStatus,
  name,
  username,
}: {
  micStatus: MicStatus;
  name: string;
  username?: string | null;
}) {
  return (
    <div className="flex items-center gap-[var(--control-gap)] rounded-[var(--radius-lg)] px-[var(--space-3)] py-[var(--space-2)]">
      <MicStatusIcon status={micStatus} />
      <Avatar className="h-[var(--space-10)] w-[var(--space-10)]" name={name} />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[length:var(--text-sm)] text-[var(--text-inverse)] [font-weight:var(--font-weight-emphasis)]">
          {name}
        </p>
        {username ? (
          <p className="truncate text-[length:var(--text-xs)] text-[var(--text-tertiary)]">{`@${username}`}</p>
        ) : null}
      </div>
    </div>
  );
}
