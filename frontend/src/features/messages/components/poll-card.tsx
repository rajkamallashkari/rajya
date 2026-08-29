import { useTranslation } from "react-i18next";
import {
  nextPollSelection,
  pollHasVoted,
  pollRevealsCounts,
  pollShare,
  type PollView,
} from "@/features/messages/model/poll";
import { cn } from "@/shared/lib/cn";
import { Badge, Button } from "@/shared/ui";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function PollCard({
  onOpenResults,
  onVote,
  poll,
}: {
  onOpenResults?: () => void;
  onVote?: (optionIds: string[]) => void;
  poll: PollView;
}) {
  const { t } = useTranslation();
  const voted = pollHasVoted(poll);
  const showCounts = pollRevealsCounts(poll, voted);
  const total = Math.max(poll.voterCount, 1);

  return (
    <div
      className="flex w-full min-w-0 flex-col gap-[var(--control-gap-tight)] rounded-[var(--radius-bubble)] bg-[var(--surface-raised)] p-[var(--space-3)]"
      data-poll-card=""
      data-poll-closed={poll.closed ? "true" : "false"}
    >
      <p className={cn("text-[var(--text-primary)]", WEIGHT_EMPHASIS)}>{poll.question}</p>
      <div className="flex flex-wrap gap-[var(--space-1)]">
        {poll.isAnonymous ? <Badge variant="muted">{t("polls.anonymous")}</Badge> : null}
        {poll.closed ? <Badge variant="warning">{t("polls.closed")}</Badge> : null}
        {poll.allowsMultiple ? <Badge variant="muted">{t("polls.multiple")}</Badge> : null}
      </div>
      <ul className="flex flex-col gap-[var(--space-1)]">
        {poll.options.map((option) => {
          const share = showCounts ? pollShare(option.voteCount, total) : 0;
          return (
            <li key={option.id}>
              <Button
                aria-pressed={option.selected}
                className={cn(
                  "relative w-full justify-between overflow-hidden text-left",
                  option.selected ? "border-[var(--accent)]" : "bg-[var(--surface-input)]",
                  poll.closed && "opacity-[var(--opacity-disabled)]",
                )}
                disabled={poll.closed}
                onClick={() => onVote?.(nextPollSelection(poll, option.id))}
                type="button"
                variant="secondary"
              >
                {showCounts ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 bg-[var(--accent-subtle)]"
                    style={{ width: `${share}%` }}
                  />
                ) : null}
                <span className="relative z-[var(--z-base)] flex w-full items-center justify-between gap-[var(--control-gap-tight)]">
                  <span className="text-[var(--text-primary)]">{option.label}</span>
                  {showCounts ? (
                    <span className="text-[var(--text-secondary)]">{`${share}%`}</span>
                  ) : null}
                </span>
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="text-[var(--text-tertiary)]">
        {poll.voterCount === 1
          ? t("polls.voter_one", { count: poll.voterCount })
          : t("polls.voter_many", { count: poll.voterCount })}
      </p>
      {poll.closesAt && !poll.closed ? (
        <p className="text-[var(--text-tertiary)]">{t("polls.closes", { when: poll.closesAt })}</p>
      ) : null}
      {onOpenResults ? (
        <Button onClick={onOpenResults} type="button" variant="ghost">
          {t("polls.results")}
        </Button>
      ) : null}
    </div>
  );
}
