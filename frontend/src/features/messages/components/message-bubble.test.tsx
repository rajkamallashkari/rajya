import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetOsmTileBudget } from "@/features/messages/model/osm-tiles";

vi.mock("@/features/messages/model/highlight", () => ({
  highlightCode: vi.fn().mockResolvedValue(null),
}));

import { MessageBubble, formatMessageTime } from "./message-bubble";
import { MessageGroup } from "./message-group";
import { TickIndicator } from "./tick-indicator";
import { TypingBubble } from "./typing-bubble";
import { DateDivider } from "./date-divider";
import { UnreadDivider } from "./unread-divider";
import { SystemMessage } from "./system-message";
import { en } from "@/shared/lib/i18n/catalog";

afterEach(() => {
  resetOsmTileBudget();
});

describe("TickIndicator", () => {
  it("renders every status", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(<TickIndicator status="queued" />);
    expect(screen.queryByRole("img")).toBeNull();

    rerender(<TickIndicator status="sent" />);
    expect(screen.getByRole("img", { name: en.messages.ticks.sent })).toBeInTheDocument();
    rerender(<TickIndicator status="delivered" />);
    expect(screen.getByRole("img", { name: en.messages.ticks.delivered })).toBeInTheDocument();
    rerender(<TickIndicator status="read" />);
    expect(screen.getByRole("img", { name: en.messages.ticks.read })).toBeInTheDocument();
    rerender(<TickIndicator onRetry={onRetry} status="failed" />);
    await user.click(screen.getByRole("button", { name: en.messages.ticks.failed }));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe("MessageBubble", () => {
  it("applies grouping chrome, hover timestamps, ticks, and jumbo", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <MessageBubble
        body="hello"
        createdAt="2026-08-27T15:04:00.000Z"
        role="first"
        senderName={en.gallery.messages.sender}
        showAvatar
        side="received"
      />,
    );
    const bubble = document.querySelector("[data-message-bubble]");
    expect(bubble).toHaveAttribute("data-role", "first");
    expect(document.querySelector("time")).toBeNull();
    await user.hover(bubble as HTMLElement);
    expect(document.querySelector("time")).not.toBeNull();
    await user.unhover(bubble as HTMLElement);

    rerender(
      <MessageBubble
        body="hello"
        createdAt="2026-08-27T15:04:00.000Z"
        role="last"
        reserveAvatar
        side="received"
      />,
    );
    expect(document.querySelector("[data-role='last']")).not.toBeNull();

    rerender(
      <MessageBubble
        body="hello"
        createdAt="2026-08-27T15:04:00.000Z"
        role="middle"
        side="sent"
        status="sent"
      />,
    );
    expect(screen.getByRole("img", { name: en.messages.ticks.sent })).toBeInTheDocument();

    rerender(
      <MessageBubble
        body="hello"
        createdAt="2026-08-27T15:04:00.000Z"
        role="single"
        side="sent"
        status="queued"
      />,
    );
    expect(document.querySelector("[data-status='queued']")).not.toBeNull();

    rerender(<MessageBubble body="plain received" side="received" />);
    expect(document.querySelector("[data-status='none']")).not.toBeNull();

    rerender(
      <MessageBubble
        body=""
        contacts={[{ contactAccountId: null, displayName: "Ada", email: null, phone: null }]}
        location={{ accuracyM: null, label: "Cafe", latitude: 1, longitude: 2 }}
        poll={{
          allowsMultiple: false,
          closed: false,
          closesAt: null,
          isAnonymous: false,
          options: [],
          question: "Q",
          voterCount: 0,
        }}
        side="received"
      />,
    );
    expect(document.querySelector("[data-poll-card]")).not.toBeNull();
    expect(document.querySelector("[data-location-card]")).not.toBeNull();
    expect(document.querySelector("[data-contact-card]")).not.toBeNull();
    const onOpenContactProfile = vi.fn();
    rerender(
      <MessageBubble
        body=""
        contacts={[{ contactAccountId: "9", displayName: "Ada", email: null, phone: null }]}
        onOpenContactProfile={onOpenContactProfile}
        side="received"
      />,
    );
    await user.click(screen.getByRole("button", { name: en.contact.open_profile }));
    expect(onOpenContactProfile).toHaveBeenCalledWith("9", "Ada");

    rerender(<MessageBubble body="🎉" side="sent" status="read" />);
    expect(document.querySelector("[data-jumbo='true']")).not.toBeNull();
    expect(document.querySelector("[data-tail]")).toBeNull();

    const onOpenMenu = vi.fn();
    rerender(<MessageBubble body="menu" lifted onOpenMenu={onOpenMenu} side="received" />);
    expect(document.querySelector("[data-lifted='true']")).not.toBeNull();
    fireEvent.contextMenu(document.querySelector("[data-message-bubble]") as HTMLElement);
    expect(onOpenMenu).toHaveBeenCalled();

    expect(formatMessageTime("2026-08-27T15:04:00.000Z", "en-GB")).toMatch(/\d{2}:\d{2}/);
  });

  it("always shows timestamps when the appearance token asks for it", () => {
    document.documentElement.dataset.timestamps = "always";
    render(
      <MessageBubble
        body="hello"
        createdAt="2026-08-27T15:04:00.000Z"
        role="first"
        side="received"
      />,
    );
    expect(document.querySelector("time")).not.toBeNull();
    document.documentElement.dataset.timestamps = "last";
  });
});

describe("MessageGroup", () => {
  it("renders a received run with one avatar and a sent run with retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onOpenMenu = vi.fn();
    const { rerender } = render(
      <MessageGroup
        messages={[
          { body: "one", createdAt: "2026-08-27T12:00:00.000Z", id: "1" },
          { body: "two", createdAt: "2026-08-27T12:00:30.000Z", id: "2" },
          { body: "three", createdAt: "2026-08-27T12:01:00.000Z", id: "3" },
        ]}
        senderName={en.gallery.messages.sender}
        side="received"
      />,
    );
    expect(document.querySelector("[data-message-group]")).toHaveAttribute("data-side", "received");
    expect(document.querySelectorAll("[data-message-bubble]")).toHaveLength(3);
    expect(document.querySelector("[data-role='middle']")).not.toBeNull();
    expect(screen.getByLabelText(en.gallery.messages.sender).className).toContain(
      "size-[var(--bubble-avatar-size)]",
    );

    rerender(
      <MessageGroup
        messages={[
          { body: "a", id: "s1", status: "sent" },
          { body: "b", id: "s2", status: "delivered" },
        ]}
        side="sent"
      />,
    );
    expect(document.querySelector("[data-message-group]")).toHaveAttribute("data-side", "sent");

    rerender(
      <MessageGroup
        messages={[{ body: "fail", id: "f", status: "failed" }]}
        onOpenMenu={onOpenMenu}
        onRetry={onRetry}
        side="sent"
      />,
    );
    await user.click(screen.getByRole("button", { name: en.messages.ticks.failed }));
    expect(onRetry).toHaveBeenCalledWith("f");
    fireEvent.contextMenu(document.querySelector("[data-message-bubble]") as HTMLElement);
    expect(onOpenMenu).toHaveBeenCalled();

    const onVote = vi.fn();
    const onOpenPollResults = vi.fn();
    rerender(
      <MessageGroup
        messages={[
          {
            body: "",
            id: "p1",
            poll: {
              allowsMultiple: false,
              closed: false,
              closesAt: null,
              isAnonymous: false,
              options: [
                {
                  id: "a",
                  label: "A",
                  position: 0,
                  selected: false,
                  voteCount: 0,
                  voters: [],
                },
              ],
              question: "Q",
              voterCount: 0,
            },
          },
        ]}
        onOpenPollResults={onOpenPollResults}
        onVote={onVote}
        side="received"
      />,
    );
    await user.click(screen.getByRole("button", { name: "A" }));
    expect(onVote).toHaveBeenCalledWith("p1", ["a"]);
    await user.click(screen.getByRole("button", { name: en.polls.results }));
    expect(onOpenPollResults).toHaveBeenCalledWith("p1");
  });
});

describe("thread chrome", () => {
  it("renders system copy, dividers, and typing states", () => {
    const { rerender } = render(
      <SystemMessage eventKey="member_joined" values={{ name: "Ada" }} />,
    );
    expect(screen.getByText("Ada joined")).toBeInTheDocument();
    rerender(<DateDivider label={en.gallery.messages.today} />);
    expect(screen.getByRole("separator")).toHaveTextContent(en.gallery.messages.today);
    rerender(<UnreadDivider />);
    expect(screen.getByText(en.messages.unread)).toBeInTheDocument();
    rerender(<TypingBubble senderName={en.gallery.messages.sender} />);
    expect(screen.getByRole("status", { name: en.messages.activity.typing })).toBeInTheDocument();
    rerender(<TypingBubble activity="recording_audio" showAvatar={false} />);
    expect(screen.getByRole("status", { name: en.messages.activity.recording_audio })).toHaveAttribute(
      "data-activity",
      "recording_audio",
    );
    expect(document.querySelector("[data-typing-bubble]")).not.toBeNull();
    rerender(<SystemMessage eventKey="icon_changed" />);
    expect(screen.getByText(en.messages.system.icon_changed)).toBeInTheDocument();
  });
});
