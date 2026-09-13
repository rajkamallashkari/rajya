import { cn } from "@/shared/lib/cn";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui";

export interface ReactionBadgeView {
  count: number;
  emoji: string;
  mine: boolean;
}

export function ReactionBadges({
  onToggle,
  reactions,
  side,
}: {
  onToggle?: (emoji: string) => void;
  reactions: ReactionBadgeView[];
  side: "received" | "sent";
}) {
  const { t } = useTranslation();
  if (reactions.length === 0) {
    return null;
  }
  return (
    <div
      aria-label={t("reactions.group")}
      className={cn(
        "relative z-10 -mt-[var(--space-2)] flex max-w-full flex-wrap gap-[var(--space-1)] px-[var(--space-1)]",
        side === "sent" ? "justify-end" : "justify-start",
      )}
      data-reaction-badges=""
      onClick={(event) => event.stopPropagation()}
      role="group"
    >
      {reactions.map(({ count, emoji, mine }) => (
        <Button
          aria-label={t(mine ? "reactions.badge_mine" : "reactions.badge", { count, emoji })}
          aria-pressed={mine}
          className={cn(
            "inline-flex min-h-[var(--space-7)] items-center gap-[var(--space-1)] rounded-full border bg-[var(--surface-elevated)] px-[var(--space-2)] text-[length:var(--text-sm)] shadow-[var(--elevation-1)]",
            mine ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--border-default)]",
          )}
          key={emoji}
          onClick={() => onToggle?.(emoji)}
          type="button"
          variant="ghost"
        >
          <span aria-hidden="true">{emoji}</span>
          {count > 1 ? <span className="tabular-nums">{count}</span> : null}
        </Button>
      ))}
    </div>
  );
}
