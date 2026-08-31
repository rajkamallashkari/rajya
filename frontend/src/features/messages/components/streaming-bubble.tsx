import { useTranslation } from "react-i18next";
import { MessageContent } from "@/features/messages/components/message-content";
import { TYPING_DOT_COUNT } from "@/features/messages/model/constants";
import { cn } from "@/shared/lib/cn";
import { Avatar, Button } from "@/shared/ui";

export function StreamingBubble({
  onCancel,
  senderName,
  senderSrc,
  text,
}: {
  onCancel: () => void;
  senderName?: string | null;
  senderSrc?: string | null;
  text: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      aria-label={t("messages.generation.streaming")}
      className="mr-auto flex max-w-[var(--bubble-max-width)] items-end gap-[var(--space-1_5)]"
      data-streaming-bubble=""
      role="status"
    >
      <Avatar className="size-[var(--bubble-avatar-size)]" name={senderName} src={senderSrc} />
      <div
        className={cn(
          "message-bubble relative flex flex-col gap-[var(--space-2)] bg-[var(--bubble-received-fill)] px-[var(--space-4)] py-[var(--space-3)]",
          "rounded-tl-[var(--radius-bubble)] rounded-tr-[var(--radius-bubble)] rounded-br-[var(--radius-bubble)] rounded-bl-[var(--radius-sm)]",
        )}
        data-side="received"
      >
        {text.length === 0 ? (
          <div className="flex items-center gap-[var(--space-1)]">
            {Array.from({ length: TYPING_DOT_COUNT }, (_, index) => (
              <span
                className="typing-dot inline-flex h-[var(--space-1_5)] w-[var(--space-1_5)] rounded-[var(--radius-full)] bg-[var(--text-tertiary)]"
                key={index}
              />
            ))}
          </div>
        ) : (
          <MessageContent body={text} />
        )}
        <Button onClick={onCancel} type="button" variant="ghost">
          {t("messages.generation.cancel")}
        </Button>
      </div>
    </div>
  );
}
