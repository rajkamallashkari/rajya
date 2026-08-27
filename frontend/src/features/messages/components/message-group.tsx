import { MessageBubble } from "@/features/messages/components/message-bubble";
import type { BubbleRole, MessageSide, TickStatus } from "@/features/messages/model/constants";
import { bubbleRole } from "@/features/messages/model/grouping";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui";

export interface GroupMessage {
  body: string;
  createdAt?: string;
  id: string;
  status?: TickStatus;
}

export function MessageGroup({
  messages,
  onMentionClick,
  onRetry,
  senderName,
  senderSrc,
  side,
}: {
  messages: GroupMessage[];
  onMentionClick?: (handle: string) => void;
  onRetry?: (id: string) => void;
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
              createdAt={message.createdAt}
              key={message.id}
              onMentionClick={onMentionClick}
              onRetry={onRetry ? () => onRetry(message.id) : undefined}
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
