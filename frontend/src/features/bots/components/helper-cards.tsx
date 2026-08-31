import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";

export function SmartReplyChips({
  onPick,
  suggestions,
}: {
  onPick: (text: string) => void;
  suggestions: string[];
}) {
  const { t } = useTranslation();
  if (suggestions.length === 0) {
    return null;
  }
  return (
    <div
      className="flex flex-wrap gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)]"
      data-smart-reply-chips=""
    >
      {suggestions.map((suggestion) => (
        <Button
          aria-label={suggestion}
          key={suggestion}
          onClick={() => onPick(suggestion)}
          size="sm"
          type="button"
          variant="secondary"
        >
          {suggestion}
        </Button>
      ))}
      <span className="sr-only">{t("messages.menu.suggest_reply")}</span>
    </div>
  );
}

export function TranslationCard({ text }: { text: string }) {
  return (
    <p
      className="mt-[var(--space-1)] max-w-[var(--bubble-max-width)] text-[length:var(--text-sm)] text-[var(--text-secondary)]"
      data-translation-card=""
    >
      {text}
    </p>
  );
}

export function SummarizeCard({
  onSummarize,
  pending = false,
  text,
}: {
  onSummarize: () => void;
  pending?: boolean;
  text?: string | null;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="rounded-[var(--radius-md)] bg-[var(--surface-raised)] px-[var(--space-3)] py-[var(--space-3)]"
      data-summarize-card=""
    >
      {text ? <p>{text}</p> : null}
      <Button disabled={pending} onClick={onSummarize} size="sm" type="button" variant="secondary">
        {t("ai.summarize")}
      </Button>
    </div>
  );
}
