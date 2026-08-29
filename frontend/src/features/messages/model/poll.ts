export const POLL_BAR_MAX = 100;

export interface PollVoter {
  accountId: string;
  name: string;
}

export interface PollOptionView {
  id: string;
  label: string;
  position: number;
  selected: boolean;
  voteCount: number;
  voters: PollVoter[];
}

export interface PollView {
  allowsMultiple: boolean;
  closed: boolean;
  closesAt: string | null;
  isAnonymous: boolean;
  options: PollOptionView[];
  question: string;
  voterCount: number;
}

export function pollShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) {
    return 0;
  }
  const share = Math.round((count / total) * POLL_BAR_MAX);
  if (share > POLL_BAR_MAX) {
    return POLL_BAR_MAX;
  }
  return share;
}

export function pollRevealsCounts(poll: PollView, hasVoted: boolean): boolean {
  return poll.closed || hasVoted;
}

export function pollHasVoted(poll: PollView): boolean {
  return poll.options.some((option) => option.selected);
}

export function nextPollSelection(poll: PollView, optionId: string): string[] {
  if (poll.closed) {
    return poll.options.filter((option) => option.selected).map((option) => option.id);
  }
  const current = poll.options.filter((option) => option.selected).map((option) => option.id);
  if (poll.allowsMultiple) {
    return current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
  }
  return current.length === 1 && current[0] === optionId ? [] : [optionId];
}
