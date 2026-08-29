import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PollCard } from "./poll-card";
import { PollResultsSheet } from "./poll-results-sheet";
import {
  nextPollSelection,
  pollHasVoted,
  pollRevealsCounts,
  pollShare,
  type PollView,
} from "@/features/messages/model/poll";
import { en } from "@/shared/lib/i18n/catalog";

const POLL: PollView = {
  allowsMultiple: false,
  closed: false,
  closesAt: "Soon",
  isAnonymous: false,
  options: [
    {
      id: "a",
      label: "A",
      position: 0,
      selected: true,
      voteCount: 2,
      voters: [{ accountId: "1", name: "Ada" }],
    },
    {
      id: "b",
      label: "B",
      position: 1,
      selected: false,
      voteCount: 0,
      voters: [],
    },
  ],
  question: "Q",
  voterCount: 2,
};

describe("poll model", () => {
  it("computes shares and selection", () => {
    expect(pollShare(0, 10)).toBe(0);
    expect(pollShare(1, 0)).toBe(0);
    expect(pollShare(1, 2)).toBe(50);
    expect(pollShare(200, 1)).toBe(100);
    expect(pollHasVoted(POLL)).toBe(true);
    expect(pollRevealsCounts(POLL, true)).toBe(true);
    expect(pollRevealsCounts({ ...POLL, closed: false }, false)).toBe(false);
    expect(nextPollSelection({ ...POLL, closed: true }, "b")).toEqual(["a"]);
    expect(nextPollSelection(POLL, "a")).toEqual([]);
    expect(nextPollSelection(POLL, "b")).toEqual(["b"]);
    const multi = { ...POLL, allowsMultiple: true };
    expect(nextPollSelection(multi, "b")).toEqual(["a", "b"]);
    expect(
      nextPollSelection(
        {
          ...multi,
          options: POLL.options.map((o) => ({ ...o, selected: o.id === "b" || o.id === "a" })),
        },
        "a",
      ),
    ).toEqual(["b"]);
  });
});

describe("PollCard", () => {
  it("votes, hides counts until voted, and opens results", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onVote = vi.fn();
    const onOpen = vi.fn();
    const fresh = {
      ...POLL,
      options: POLL.options.map((option) => ({ ...option, selected: false, voteCount: 0 })),
      voterCount: 0,
      closesAt: null,
    };
    const { rerender } = render(<PollCard onVote={onVote} poll={fresh} />);
    expect(screen.queryByText("0%")).toBeNull();
    await user.click(screen.getByRole("button", { name: "A" }));
    expect(onVote).toHaveBeenCalled();
    rerender(
      <PollCard
        onOpenResults={onOpen}
        poll={{ ...POLL, isAnonymous: true, closed: true, allowsMultiple: true, voterCount: 1 }}
      />,
    );
    expect(screen.getByText(en.polls.anonymous)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A 100%" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: en.polls.results }));
    expect(onOpen).toHaveBeenCalled();
  });
});

describe("PollResultsSheet", () => {
  it("hides voters when anonymous and lists them otherwise", async () => {
    render(<PollResultsSheet onOpenChange={vi.fn()} open poll={POLL} />);
    expect(screen.getByText("Ada")).toBeInTheDocument();
    const firstOption = POLL.options[0];
    const secondOption = POLL.options[1];
    if (!firstOption || !secondOption) {
      throw new Error("poll fixture");
    }
    render(
      <PollResultsSheet
        onOpenChange={vi.fn()}
        open
        poll={{
          ...POLL,
          options: [
            { ...firstOption, voteCount: 1 },
            { ...secondOption, voteCount: 2, voters: [{ accountId: "2", name: "Priya" }] },
          ],
        }}
      />,
    );
    expect(screen.getByText(/1 vote/)).toBeInTheDocument();
    render(
      <PollResultsSheet
        onOpenChange={vi.fn()}
        open
        poll={{
          ...POLL,
          isAnonymous: true,
          options: POLL.options.map((o) => ({ ...o, voteCount: 1 })),
        }}
      />,
    );
    expect(screen.getByText(en.polls.voters_hidden)).toBeInTheDocument();
  });
});
