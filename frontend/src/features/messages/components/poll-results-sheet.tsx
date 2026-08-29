import { useTranslation } from "react-i18next";
import type { PollView } from "@/features/messages/model/poll";
import { Avatar } from "@/shared/ui";
import { BottomSheet, BottomSheetContent, BottomSheetTitle } from "@/shared/ui/bottom-sheet";
import { EmptyState } from "@/shared/ui/empty-state";
import { Separator } from "@/shared/ui/separator";
import { WEIGHT_EMPHASIS } from "@/shared/ui/metrics";

export function PollResultsSheet({
  onOpenChange,
  open,
  poll,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  poll: PollView;
}) {
  const { t } = useTranslation();
  return (
    <BottomSheet onOpenChange={onOpenChange} open={open}>
      <BottomSheetContent>
        <BottomSheetTitle>{t("polls.results_title")}</BottomSheetTitle>
        <p className="mb-[var(--space-3)] text-[var(--text-secondary)]">{poll.question}</p>
        {poll.isAnonymous ? (
          <p className="mb-[var(--space-3)] text-[var(--text-tertiary)]">
            {t("polls.voters_hidden")}
          </p>
        ) : null}
        <div className="flex flex-col gap-[var(--space-4)]">
          {poll.options.map((option) => (
            <section key={option.id}>
              <p className={WEIGHT_EMPHASIS}>
                {option.label}
                {" · "}
                {option.voteCount === 1
                  ? t("polls.vote_one", { count: option.voteCount })
                  : t("polls.vote_many", { count: option.voteCount })}
              </p>
              {poll.isAnonymous ? null : option.voters.length === 0 ? (
                <EmptyState title={t("polls.no_voters")} />
              ) : (
                <ul className="mt-[var(--space-2)] flex flex-col">
                  {option.voters.map((voter) => (
                    <li
                      className="flex min-h-[var(--control-height)] items-center gap-[var(--control-gap-tight)]"
                      key={voter.accountId}
                    >
                      <Avatar name={voter.name} />
                      <span>{voter.name}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Separator className="mt-[var(--space-3)]" />
            </section>
          ))}
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}
