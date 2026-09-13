import type { KeyboardEvent, ReactNode } from "react";
import { TranslationCard } from "@/features/bots";
import { ContactCard, type ContactView } from "@/features/messages/components/contact-card";
import { LocationCard, type LocationView } from "@/features/messages/components/location-card";
import { MessageContent } from "@/features/messages/components/message-content";
import { PollCard } from "@/features/messages/components/poll-card";
import {
  ReactionBadges,
  type ReactionBadgeView,
} from "@/features/messages/components/reaction-badges";
import { TickIndicator } from "@/features/messages/components/tick-indicator";
import type { PollView } from "@/features/messages/model/poll";
import type { BubbleRole, MessageSide, TickStatus } from "@/features/messages/model/constants";
import { getJumboInfo, isEmojiOnly } from "@/features/messages/model/jumbo-emoji";
import { useLongPress } from "@/shared/hooks/use-long-press";
import { useDateTimeFormatter } from "@/shared/hooks/use-date-time-formatter";
import { cn } from "@/shared/lib/cn";
import { DEFAULT_DATE_TIME_PREFERENCES, formatPreferenceTime } from "@/shared/lib/date-time";
import { AttachmentBody } from "@/features/media";
import type { Attachment } from "@/features/media/model/constants";
import { Avatar } from "@/shared/ui";

const RADIUS = {
  sent: {
    first:
      "rounded-tl-[var(--radius-bubble)] rounded-tr-[var(--radius-bubble)] rounded-bl-[var(--radius-bubble)] rounded-br-none",
    last: "rounded-tl-[var(--radius-bubble)] rounded-tr-none rounded-bl-[var(--radius-bubble)] rounded-br-[var(--radius-bubble)]",
    middle:
      "rounded-tl-[var(--radius-bubble)] rounded-tr-none rounded-bl-[var(--radius-bubble)] rounded-br-none",
    single:
      "rounded-tl-[var(--radius-bubble)] rounded-tr-[var(--radius-bubble)] rounded-bl-[var(--radius-bubble)] rounded-br-[var(--radius-bubble)]",
  },
  received: {
    first:
      "rounded-tl-[var(--radius-bubble)] rounded-tr-[var(--radius-bubble)] rounded-bl-none rounded-br-[var(--radius-bubble)]",
    last: "rounded-tl-none rounded-tr-[var(--radius-bubble)] rounded-bl-[var(--radius-bubble)] rounded-br-[var(--radius-bubble)]",
    middle:
      "rounded-tl-none rounded-tr-[var(--radius-bubble)] rounded-bl-none rounded-br-[var(--radius-bubble)]",
    single:
      "rounded-tl-[var(--radius-bubble)] rounded-tr-[var(--radius-bubble)] rounded-bl-[var(--radius-bubble)] rounded-br-[var(--radius-bubble)]",
  },
} as const;

export function formatMessageTime(iso: string, locale: string): string {
  return formatPreferenceTime(iso, locale, DEFAULT_DATE_TIME_PREFERENCES);
}

export function MessageBubble({
  accessibleLabel,
  attachments = [],
  body,
  children,
  createdAt,
  id,
  lifted = false,
  onMentionClick,
  onActivate,
  onOpenContactProfile,
  onOpenMenu,
  onOpenPollResults,
  onToggleReaction,
  onRetry,
  onVote,
  poll,
  reactions = [],
  location,
  contacts = [],
  reserveAvatar,
  role = "single",
  senderName,
  senderSrc,
  showAvatar = false,
  side,
  status,
  translation,
}: {
  accessibleLabel?: string;
  attachments?: Attachment[];
  body: string;
  children?: ReactNode;
  id?: string;
  createdAt?: string;
  lifted?: boolean;
  onActivate?: () => void;
  onMentionClick?: (handle: string) => void;
  onOpenContactProfile?: (accountId: string, name: string) => void;
  onOpenMenu?: (point: { clientX: number; clientY: number }) => void;
  onOpenPollResults?: () => void;
  onToggleReaction?: (emoji: string) => void;
  onRetry?: () => void;
  onVote?: (optionIds: string[]) => void;
  poll?: PollView;
  reactions?: ReactionBadgeView[];
  location?: LocationView;
  contacts?: ContactView[];
  reserveAvatar?: boolean;
  role?: BubbleRole;
  senderName?: string | null;
  senderSrc?: string | null;
  showAvatar?: boolean;
  side: MessageSide;
  status?: TickStatus;
  translation?: string;
}) {
  const formatDateTime = useDateTimeFormatter();
  const emojiOnly = isEmojiOnly(body);
  const showTime = Boolean(createdAt);
  const queued = status === "queued";
  const fill =
    side === "sent" ? "bg-[var(--bubble-sent-fill)]" : "bg-[var(--bubble-received-fill)]";
  const keepAvatarSlot = reserveAvatar ?? (side === "received" && !showAvatar);
  const showTicks = side === "sent" && Boolean(status);
  const longPress = useLongPress(onOpenMenu ?? null, { enabled: Boolean(onOpenMenu) });
  const activateFromKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (onActivate && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onActivate();
    }
  };

  return (
    <div
      className={cn(
        "group/msg flex max-w-[var(--bubble-max-width)] items-end gap-[var(--space-1_5)]",
        side === "sent" ? "ml-auto flex-row-reverse" : "mr-auto",
        queued && "opacity-[var(--opacity-queued)]",
        lifted && "relative z-[var(--z-popover)]",
      )}
    >
      {side === "received" && showAvatar ? (
        <Avatar className="size-[var(--bubble-avatar-size)]" name={senderName} src={senderSrc} />
      ) : keepAvatarSlot ? (
        <span className="inline-flex size-[var(--bubble-avatar-size)] shrink-0" />
      ) : null}
      <div className={cn("flex min-w-0 flex-col", side === "sent" ? "items-end" : "items-start")}>
        <article
          aria-label={accessibleLabel}
          className={cn(
            "message-bubble relative max-w-full",
            emojiOnly
              ? "bg-transparent py-[var(--space-2)]"
              : cn(fill, RADIUS[side][role], "px-[var(--space-4)] py-[var(--space-2)]"),
            lifted && "shadow-[var(--elevation-3)]",
          )}
          data-jumbo={getJumboInfo(body) !== null ? "true" : "false"}
          data-lifted={lifted ? "true" : "false"}
          data-message-bubble=""
          data-message-id={id}
          data-role={role}
          data-side={side}
          data-status={status ?? "none"}
          onClick={onActivate}
          onContextMenu={(event) => {
            longPress.onContextMenu(event);
            if (onOpenMenu) {
              event.preventDefault();
              event.stopPropagation();
              onOpenMenu({ clientX: event.clientX, clientY: event.clientY });
            }
          }}
          onKeyDown={activateFromKeyboard}
          onPointerCancel={longPress.onPointerCancel}
          onPointerDown={longPress.onPointerDown}
          onPointerMove={longPress.onPointerMove}
          onPointerUp={longPress.onPointerUp}
          role={onActivate ? "button" : undefined}
          tabIndex={onActivate ? 0 : undefined}
        >
          {children}
          {attachments.length > 0 && id ? (
            <AttachmentBody attachments={attachments} messageId={id} />
          ) : null}
          {body ? <MessageContent body={body} onMentionClick={onMentionClick} /> : null}
          {poll ? <PollCard onOpenResults={onOpenPollResults} onVote={onVote} poll={poll} /> : null}
          {location ? <LocationCard location={location} /> : null}
          {contacts.map((contact) => (
            <ContactCard
              contact={contact}
              key={`${contact.displayName}-${contact.phone ?? ""}`}
              onOpenProfile={
                contact.contactAccountId && onOpenContactProfile
                  ? () =>
                      onOpenContactProfile(contact.contactAccountId as string, contact.displayName)
                  : undefined
              }
            />
          ))}
          {showTime || showTicks ? (
            <div
              className={cn(
                "mt-[var(--space-1)] flex items-center gap-[var(--space-1)]",
                side === "sent" ? "justify-end" : "justify-start",
              )}
            >
              {createdAt && showTime ? (
                <time
                  className="text-[length:var(--text-xs)] text-[var(--text-tertiary)]"
                  dateTime={createdAt}
                >
                  {formatDateTime.time(createdAt)}
                </time>
              ) : null}
              {showTicks && status ? <TickIndicator onRetry={onRetry} status={status} /> : null}
            </div>
          ) : null}
        </article>
        <ReactionBadges onToggle={onToggleReaction} reactions={reactions} side={side} />
        {translation ? <TranslationCard text={translation} /> : null}
      </div>
    </div>
  );
}
