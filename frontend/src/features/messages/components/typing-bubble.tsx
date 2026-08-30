import { useTranslation } from "react-i18next";
import { TYPING_DOT_COUNT } from "@/features/messages/model/constants";
import type { ActivityKind } from "@/features/conversations/model/typing";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui";

export function TypingBubble({
  activity = "typing",
  senderName,
  senderSrc,
  showAvatar = true,
}: {
  activity?: ActivityKind;
  senderName?: string | null;
  senderSrc?: string | null;
  showAvatar?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      aria-label={t(`messages.activity.${activity}`)}
      className="mr-auto flex max-w-[var(--bubble-max-width)] items-end gap-[var(--space-1_5)]"
      data-activity={activity}
      data-typing-bubble=""
      role="status"
    >
      {showAvatar ? (
        <Avatar className="size-[var(--bubble-avatar-size)]" name={senderName} src={senderSrc} />
      ) : (
        <span className="inline-flex size-[var(--bubble-avatar-size)] shrink-0" />
      )}
      <div
        className={cn(
          "message-bubble relative flex items-center gap-[var(--space-1)] bg-[var(--bubble-received-fill)] px-[var(--space-4)] py-[var(--space-3)]",
          "rounded-tl-[var(--radius-bubble)] rounded-tr-[var(--radius-bubble)] rounded-br-[var(--radius-bubble)] rounded-bl-[var(--radius-sm)]",
        )}
        data-side="received"
      >
        {Array.from({ length: TYPING_DOT_COUNT }, (_, index) => (
          <span
            className="typing-dot inline-flex h-[var(--space-1_5)] w-[var(--space-1_5)] rounded-[var(--radius-full)] bg-[var(--text-tertiary)]"
            key={index}
          />
        ))}
      </div>
    </div>
  );
}
