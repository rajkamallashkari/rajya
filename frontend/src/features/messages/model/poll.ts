import type { Message } from "@/features/conversations/api/http";
import type { ContactView } from "@/features/messages/components/contact-card";
import type { LocationView } from "@/features/messages/components/location-card";

export const POLL_BAR_MAX = 100;

export function pollViewFromApi(poll: NonNullable<Message["poll"]>): PollView {
  return {
    allowsMultiple: poll.allows_multiple,
    closed: poll.closed,
    closesAt: poll.closes_at ?? null,
    isAnonymous: poll.is_anonymous,
    question: poll.question,
    voterCount: poll.voter_count,
    options: poll.options.map((option) => ({
      id: String(option.id),
      label: option.label,
      position: option.position,
      selected: option.selected,
      voteCount: option.vote_count,
      voters: (option.voters ?? []).map((voter) => ({
        accountId: String(voter.account_id ?? ""),
        name: voter.display_name ?? "",
      })),
    })),
  };
}

export function locationViewFromApi(location: NonNullable<Message["location"]>): LocationView {
  return {
    accuracyM: location.accuracy_m ?? null,
    label: location.label ?? null,
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
  };
}

export function contactViewFromApi(contact: NonNullable<Message["contacts"]>[number]): ContactView {
  return {
    contactAccountId: contact.contact_account_id == null ? null : String(contact.contact_account_id),
    displayName: contact.display_name,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
  };
}

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
