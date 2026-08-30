import { MessageBubble } from "@/features/messages/components/message-bubble";
import type { ContactView } from "@/features/messages/components/contact-card";
import type { LocationView } from "@/features/messages/components/location-card";
import type { BubbleRole, MessageSide, TickStatus } from "@/features/messages/model/constants";
import type { PollView } from "@/features/messages/model/poll";
import { bubbleRole } from "@/features/messages/model/grouping";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui";

export interface GroupMessage {
  body: string;
  contacts?: ContactView[];
  createdAt?: string;
  id: string;
  location?: LocationView;
  poll?: PollView;
  status?: TickStatus;
}

export function MessageGroup({
  messages,
  onMentionClick,
  onOpenMenu,
  onOpenPollResults,
  onRetry,
  onVote,
  senderName,
  senderSrc,
  side,
}: {
  messages: GroupMessage[];
  onMentionClick?: (handle: string) => void;
  onOpenMenu?: (id: string, point: { clientX: number; clientY: number }) => void;
  onOpenPollResults?: (id: string) => void;
  onRetry?: (id: string) => void;
  onVote?: (id: string, optionIds: string[]) => void;
  senderName?: string | null;
  senderSrc?: string | null;
  side: MessageSide;
}) {
  const count = messages.length;
  const showGroupAvatar = side === "received";

  return (
    <div
      className={cn(
        "flex items-end gap-[var(--space-1_5)]",
        side === "sent" ? "flex-row-reverse" : "flex-row",
      )}
      data-message-group=""
      data-side={side}
    >
      {showGroupAvatar ? (
        <Avatar className="size-[var(--bubble-avatar-size)]" name={senderName} src={senderSrc} />
      ) : null}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-[var(--space-0_5)]",
          side === "sent" ? "items-end" : "items-start",
        )}
      >
        {messages.map((message, index) => {
          const role: BubbleRole = bubbleRole(index, count);
          return (
            <MessageBubble
              body={message.body}
              contacts={message.contacts}
              createdAt={message.createdAt}
              key={message.id}
              location={message.location}
              onMentionClick={onMentionClick}
              onOpenMenu={
                onOpenMenu ? (point) => onOpenMenu(message.id, point) : undefined
              }
              onOpenPollResults={
                onOpenPollResults ? () => onOpenPollResults(message.id) : undefined
              }
              onRetry={onRetry ? () => onRetry(message.id) : undefined}
              onVote={onVote ? (optionIds) => onVote(message.id, optionIds) : undefined}
              poll={message.poll}
              reserveAvatar={false}
              role={role}
              showAvatar={false}
              side={side}
              status={message.status}
            />
          );
        })}
      </div>
    </div>
  );
}
