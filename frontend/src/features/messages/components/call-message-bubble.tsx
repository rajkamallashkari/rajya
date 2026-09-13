import { Phone, Video } from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { returnToCall } from "@/features/calls/lib";
import { isLiveCallStatus } from "@/features/calls/model/live";
import { useCallStore } from "@/features/calls/store/call-store";
import { MessageBubble } from "@/features/messages/components/message-bubble";
import type { BubbleRole, MessageSide } from "@/features/messages/model/constants";
import { cn } from "@/shared/lib/cn";

export type CallPhase = "active" | "busy" | "declined" | "ended" | "missed" | "ringing";

export interface CallMetadata {
  answered_at?: string | null;
  busy?: boolean;
  call_id?: number;
  duration_seconds?: number | null;
  initiated_at?: string | null;
  initiator_account_id?: number;
  kind?: string;
  status?: string;
}

export function callMetadata(value: unknown): CallMetadata {
  return value && typeof value === "object" ? (value as CallMetadata) : {};
}

export function resolveCallPhase(metadata: CallMetadata, event: string): CallPhase {
  if (metadata.busy && (metadata.status === "missed" || metadata.status === "declined")) {
    return "busy";
  }
  if (
    metadata.status === "active" ||
    metadata.status === "declined" ||
    metadata.status === "ended" ||
    metadata.status === "missed" ||
    metadata.status === "ringing"
  ) {
    return metadata.status;
  }
  if (event === "call_missed") {
    return "missed";
  }
  if (event === "call_started") {
    return "ringing";
  }
  return "ended";
}

export function callMessageSide(metadata: CallMetadata, viewerId: number): MessageSide {
  return metadata.initiator_account_id === viewerId ? "sent" : "received";
}

export function callMessageDetail(
  metadata: CallMetadata,
  event: string,
  side: MessageSide,
  t: TFunction,
  fallback?: string | null,
): { detail: string; phase: CallPhase } {
  const phase = resolveCallPhase(metadata, event);
  const duration = Math.max(0, Number(metadata.duration_seconds) || 0);
  const minutes = Math.floor(duration / 60);
  const seconds = String(duration % 60).padStart(2, "0");
  const detail =
    duration > 0 && phase === "ended"
      ? t("messages.call.duration", { minutes, seconds })
      : t(`messages.call.status.${phase}.${side}`, {
          defaultValue: fallback ?? t(`messages.call.status.${phase}.received`),
        });
  return { detail, phase };
}

export function CallMessageBubble({
  body,
  createdAt,
  event,
  id,
  metadata: metadataValue,
  reserveAvatar,
  role = "single",
  senderName,
  senderSrc,
  showAvatar = false,
  viewerId,
}: {
  body?: string | null;
  createdAt: string;
  event: string;
  id?: string;
  metadata?: unknown;
  reserveAvatar?: boolean;
  role?: BubbleRole;
  senderName?: string | null;
  senderSrc?: string | null;
  showAvatar?: boolean;
  viewerId: number;
}) {
  const { t } = useTranslation();
  const metadata = callMetadata(metadataValue);
  const side = callMessageSide(metadata, viewerId);
  const { detail, phase } = callMessageDetail(metadata, event, side, t, body);
  const activeCallId = useCallStore((state) => state.callId);
  const callStatus = useCallStore((state) => state.status);
  const setMinimized = useCallStore((state) => state.setMinimized);
  const stuckCall = useCallStore((state) => state.stuckCall);
  const isVideo = metadata.kind === "video";
  const title = t(`messages.call.${isVideo ? "video" : "audio"}`);
  const accessibleLabel = t("messages.call.accessible", { detail, title });
  const hasCallId = typeof metadata.call_id === "number";
  const matchesLiveCall =
    phase === "active" &&
    hasCallId &&
    metadata.call_id === activeCallId &&
    isLiveCallStatus(callStatus);
  const matchesStuckCall = phase === "active" && hasCallId && metadata.call_id === stuckCall?.id;
  const onActivate =
    matchesLiveCall || matchesStuckCall
      ? () => {
          if (matchesLiveCall) {
            setMinimized(false);
            return;
          }
          void returnToCall();
        }
      : undefined;

  return (
    <MessageBubble
      accessibleLabel={accessibleLabel}
      body=""
      createdAt={createdAt}
      id={id}
      onActivate={onActivate}
      reserveAvatar={reserveAvatar}
      role={role}
      senderName={senderName}
      senderSrc={senderSrc}
      showAvatar={showAvatar}
      side={side}
    >
      <CallMessageContent detail={detail} event={event} isVideo={isVideo} phase={phase} />
    </MessageBubble>
  );
}

export function CallMessageContent({
  detail,
  event,
  isVideo,
  phase,
}: {
  detail: string;
  event: string;
  isVideo: boolean;
  phase: CallPhase;
}) {
  const Icon = isVideo ? Video : Phone;
  const danger = phase === "busy" || phase === "declined" || phase === "missed";

  return (
    <span
      className="flex w-fit items-center gap-[var(--space-3)]"
      data-call-message={event}
      data-call-phase={phase}
    >
      <span
        className={cn(
          "flex size-[var(--space-10)] shrink-0 items-center justify-center rounded-[var(--radius-full)]",
          danger
            ? "bg-[color-mix(in_srgb,var(--status-danger)_14%,transparent)] text-[var(--status-danger)]"
            : "bg-[var(--accent-subtle)] text-[var(--accent)]",
        )}
      >
        <Icon aria-hidden="true" className="size-[var(--space-5)]" />
      </span>
      <span
        className={cn(
          "block whitespace-nowrap text-[length:var(--text-sm)] [font-weight:var(--font-weight-emphasis)]",
          danger ? "text-[var(--status-danger)]" : "text-[var(--text-secondary)]",
        )}
      >
        {detail}
      </span>
    </span>
  );
}
