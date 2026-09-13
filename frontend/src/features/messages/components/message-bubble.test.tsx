import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetOsmTileBudget } from "@/features/messages/model/osm-tiles";
import { AppProviders } from "@/app/providers";

vi.mock("@/features/messages/model/highlight", () => ({
  highlightCode: vi.fn().mockResolvedValue(null),
}));

import { MessageBubble, formatMessageTime } from "./message-bubble";
import { MessageGroup } from "./message-group";
import { ReactionBadges } from "./reaction-badges";
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
  it("renders reaction badges and keeps long emoji-only messages bubbleless", async () => {
    const user = userEvent.setup();
    const onToggleReaction = vi.fn();
    const { rerender } = render(
      <MessageBubble
        body="hello"
        onToggleReaction={onToggleReaction}
        reactions={[{ count: 3, emoji: "🎉", mine: true }]}
        side="sent"
      />,
    );
    const badge = screen.getByRole("button", {
      name: "🎉 reaction, 3 total, including yours",
    });
    expect(badge).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("3")).toBeInTheDocument();
    await user.click(badge);
    expect(onToggleReaction).toHaveBeenCalledWith("🎉");

    rerender(<MessageBubble body="😀 😃 😄 😁 😆" side="received" />);
    expect(document.querySelector(".message-bubble")?.className).toContain("bg-transparent");
    expect(document.querySelector("[data-jumbo='false']")).not.toBeNull();

    rerender(<MessageBubble body="😀 hello" side="received" />);
    expect(document.querySelector(".message-bubble")?.className).not.toContain("bg-transparent");
  });

  it("applies grouping chrome, always-visible timestamps, ticks, and jumbo", async () => {
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
    expect(document.querySelector("time")).not.toBeNull();

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

  it("renders attachments before captions and always shows bubble time", () => {
    render(
      <AppProviders>
        <MessageBubble
          attachments={[
            {
              byte_size: 5,
              content_type: "text/plain",
              filename: "notes.txt",
              id: 77,
              kind: "file",
              processing_status: "ready",
            },
          ]}
          body="caption"
          createdAt="2026-08-27T15:04:00.000Z"
          id="7"
          role="first"
          side="received"
        />
      </AppProviders>,
    );
    const attachment = document.querySelector("[data-attachment-body]");
    const caption = document.querySelector("[data-message-content]");
    expect(attachment).not.toBeNull();
    expect(caption).not.toBeNull();
    expect(
      (attachment as Node).compareDocumentPosition(caption as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(document.querySelectorAll("time")).toHaveLength(1);
  });
});

describe("MessageGroup", () => {
  it("squares only the sender-side corners across complete runs", () => {
    const run = ["first", "middle-a", "middle-b", "last"].map((body, index) => ({
      body,
      id: String(index),
    }));
    render(
      <>
        <MessageBubble body="received-single" role="single" side="received" />
        <MessageGroup messages={run} side="received" />
        <MessageBubble body="sent-single" role="single" side="sent" />
        <MessageGroup messages={run} side="sent" />
      </>,
    );
    const bubbles = Array.from(document.querySelectorAll(".message-bubble"));
    const received = bubbles.slice(0, 5);
    const sent = bubbles.slice(5);

    expect(received[0]).toHaveClass(
      "rounded-tl-[var(--radius-bubble)]",
      "rounded-bl-[var(--radius-bubble)]",
    );
    expect(received[1]).toHaveClass("rounded-bl-none");
    expect(received[1]).not.toHaveClass("rounded-tl-none");
    expect(received[2]).toHaveClass("rounded-tl-none", "rounded-bl-none");
    expect(received[3]).toHaveClass("rounded-tl-none", "rounded-bl-none");
    expect(received[4]).toHaveClass("rounded-tl-none", "rounded-bl-[var(--radius-bubble)]");
    received.forEach((bubble) => {
      expect(bubble).toHaveClass("rounded-tr-[var(--radius-bubble)]");
      expect(bubble).toHaveClass("rounded-br-[var(--radius-bubble)]");
    });

    expect(sent[0]).toHaveClass(
      "rounded-tr-[var(--radius-bubble)]",
      "rounded-br-[var(--radius-bubble)]",
    );
    expect(sent[1]).toHaveClass("rounded-br-none");
    expect(sent[1]).not.toHaveClass("rounded-tr-none");
    expect(sent[2]).toHaveClass("rounded-tr-none", "rounded-br-none");
    expect(sent[3]).toHaveClass("rounded-tr-none", "rounded-br-none");
    expect(sent[4]).toHaveClass("rounded-tr-none", "rounded-br-[var(--radius-bubble)]");
    sent.forEach((bubble) => {
      expect(bubble).toHaveClass("rounded-tl-[var(--radius-bubble)]");
      expect(bubble).toHaveClass("rounded-bl-[var(--radius-bubble)]");
    });
  });

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
    const onToggleReaction = vi.fn();
    rerender(
      <MessageGroup
        messages={[
          {
            body: "",
            id: "p1",
            reactions: [{ count: 2, emoji: "👍", mine: true }],
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
        onToggleReaction={onToggleReaction}
        onVote={onVote}
        side="received"
      />,
    );
    await user.click(screen.getByRole("button", { name: "A" }));
    expect(onVote).toHaveBeenCalledWith("p1", ["a"]);
    await user.click(screen.getByRole("button", { name: en.polls.results }));
    expect(onOpenPollResults).toHaveBeenCalledWith("p1");
    await user.click(screen.getByText("👍").closest("button")!);
    expect(onToggleReaction).toHaveBeenCalledWith("p1", "👍");
  });
});

describe("ReactionBadges", () => {
  it("renders sent and received reactions without bubbling clicks", async () => {
    const user = userEvent.setup();
    const parentClick = vi.fn();
    const onToggle = vi.fn();
    const { rerender } = render(
      <div onClick={parentClick}>
        <ReactionBadges
          onToggle={onToggle}
          reactions={[{ count: 1, emoji: "🚀", mine: false }]}
          side="sent"
        />
      </div>,
    );
    await user.click(screen.getByText("🚀").closest("button")!);
    expect(onToggle).toHaveBeenCalledWith("🚀");
    expect(parentClick).not.toHaveBeenCalled();

    rerender(
      <ReactionBadges reactions={[{ count: 2, emoji: "👍", mine: true }]} side="received" />,
    );
    expect(screen.getByText("2")).toBeInTheDocument();
    rerender(<ReactionBadges reactions={[]} side="received" />);
    expect(document.querySelector("[data-reaction-badges]")).toBeNull();
  });
});

describe("thread chrome", () => {
  it("renders system copy, dividers, and typing states", () => {
    const { rerender } = render(
      <SystemMessage eventKey="member_joined" values={{ name: "Ada" }} />,
    );
    expect(screen.getByText("Ada joined")).toBeInTheDocument();
    const onDateClick = vi.fn();
    rerender(<DateDivider label={en.gallery.messages.today} onClick={onDateClick} />);
    fireEvent.click(screen.getByRole("button", { name: en.gallery.messages.today }));
    expect(onDateClick).toHaveBeenCalledOnce();
    rerender(<UnreadDivider />);
    expect(screen.getByText(en.messages.unread)).toBeInTheDocument();
    rerender(<TypingBubble senderName={en.gallery.messages.sender} />);
    expect(screen.getByRole("status", { name: en.messages.activity.typing })).toBeInTheDocument();
    rerender(<TypingBubble activity="recording_audio" showAvatar={false} />);
    expect(
      screen.getByRole("status", { name: en.messages.activity.recording_audio }),
    ).toHaveAttribute("data-activity", "recording_audio");
    expect(document.querySelector("[data-typing-bubble]")).not.toBeNull();
    rerender(<SystemMessage eventKey="icon_changed" />);
    expect(screen.getByText(en.messages.system.icon_changed)).toBeInTheDocument();
  });
});
