import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatListItem } from "./chat-list-item";
import { ConversationMenu, SwipeActions } from "./conversation-menu";
import { SWIPE_COMMIT_PX } from "@/features/conversations/model/constants";
import { en } from "@/shared/lib/i18n/catalog";

describe("ChatListItem", () => {
  it("renders pin, mute, unread, typing, system, media, and swipe actions", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onOpen = vi.fn();
    const onMute = vi.fn();
    const onArchive = vi.fn();
    const onMarkRead = vi.fn();
    const onMarkUnread = vi.fn();
    const onPin = vi.fn();
    const { rerender } = render(
      <ChatListItem
        archived
        isGroup
        kind="group"
        lastActivity={{ kind: "text", senderName: "Ada", text: "hello" }}
        muted
        name="Team"
        onArchive={onArchive}
        onMarkRead={onMarkRead}
        onMarkUnread={onMarkUnread}
        onMute={onMute}
        onOpen={onOpen}
        onPin={onPin}
        pinned
        presence="online"
        selected
        timestampLabel="14:02"
        unreadCount={12}
      />,
    );
    const row = document.querySelector("[data-chat-list-item]") as HTMLElement;
    expect(row).toHaveAttribute("data-pinned", "true");
    expect(row).toHaveAttribute("data-muted", "true");
    expect(row).toHaveAttribute("data-unread", "true");
    expect(row).toHaveAttribute("data-kind", "group");
    expect(screen.getByLabelText(en.conversations.pinned)).toBeInTheDocument();
    expect(screen.getByText("9+")).toBeInTheDocument();
    expect(screen.getByText("Ada:")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: en.conversations.unmute }));
    expect(onMute).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: en.conversations.archive }));
    expect(onArchive).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: en.conversations.mark_read }));
    expect(onMarkRead).toHaveBeenCalled();

    const surface = row.querySelector("[style]") as HTMLElement;
    fireEvent.pointerDown(surface, { clientX: 80, clientY: 10, button: 0, pointerType: "mouse" });
    fireEvent.pointerUp(surface);
    expect(onOpen).toHaveBeenCalled();

    fireEvent.pointerDown(surface, { clientX: 20, clientY: 10, button: 0 });
    fireEvent.pointerMove(surface, { clientX: 20 + SWIPE_COMMIT_PX, clientY: 10 });
    fireEvent.pointerUp(surface);
    expect(onMarkRead).toHaveBeenCalledTimes(2);

    fireEvent.contextMenu(surface);
    await user.click(screen.getByRole("menuitem", { name: en.conversations.unpin }));
    expect(onPin).toHaveBeenCalled();

    rerender(
      <ChatListItem lastActivity={{ kind: "typing", text: "" }} name="Ada" timestampLabel="now" />,
    );
    expect(screen.getByText(en.conversations.typing)).toBeInTheDocument();

    rerender(
      <ChatListItem
        lastActivity={{ kind: "system", text: "updated" }}
        markedUnread
        name="Ada"
        onMarkRead={onMarkRead}
        onMarkUnread={onMarkUnread}
        timestampLabel="now"
      />,
    );
    expect(screen.getByText("updated")).toBeInTheDocument();
    fireEvent.contextMenu(document.querySelector("[style]") as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.conversations.mark_read }));
    expect(onMarkRead).toHaveBeenCalledTimes(3);

    rerender(
      <ChatListItem
        lastActivity={{ kind: "text", text: "hi" }}
        name="Ada"
        onMarkUnread={onMarkUnread}
        timestampLabel="now"
      />,
    );
    fireEvent.contextMenu(document.querySelector("[style]") as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.conversations.mark_unread }));
    expect(onMarkUnread).toHaveBeenCalled();

    rerender(
      <ChatListItem
        lastActivity={{ kind: "media", text: "clip" }}
        name="Ada"
        timestampLabel="now"
      />,
    );
    expect(screen.getByText("clip")).toBeInTheDocument();
    rerender(
      <ChatListItem
        lastActivity={{ kind: "media", mediaType: "video", text: "" }}
        name="Ada"
        timestampLabel="now"
      />,
    );
    expect(screen.getByText(en.conversations.media.video)).toBeInTheDocument();

    fireEvent.pointerDown(document.querySelector("[style]") as HTMLElement, {
      clientX: 90,
      clientY: 8,
      button: 0,
    });
    fireEvent.pointerMove(document.querySelector("[style]") as HTMLElement, {
      clientX: 90 - SWIPE_COMMIT_PX - 5,
      clientY: 8,
    });
    fireEvent.pointerUp(document.querySelector("[style]") as HTMLElement);

    rerender(
      <ChatListItem
        lastActivity={{ kind: "text", text: "hi" }}
        name="Ada"
        timestampLabel="now"
        unreadCount={1}
      />,
    );
    const unreadRow = document.querySelector("[style]") as HTMLElement;
    fireEvent.pointerDown(unreadRow, { clientX: 40, clientY: 8, button: 0 });
    fireEvent.pointerMove(unreadRow, { clientX: 40 + SWIPE_COMMIT_PX + 5, clientY: 8 });
    fireEvent.pointerUp(unreadRow);
    fireEvent.contextMenu(unreadRow);
    await user.click(screen.getByRole("button", { name: en.ui.close }));

    rerender(
      <ChatListItem lastActivity={{ kind: "text", text: "hi" }} name="Ada" timestampLabel="now" />,
    );
    const plain = document.querySelector("[style]") as HTMLElement;
    fireEvent.pointerDown(plain, { clientX: 10, clientY: 10, button: 0 });
    fireEvent.pointerUp(plain);
  });
});

describe("ConversationMenu", () => {
  it("closes from the scrim and hides missing actions", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onClose = vi.fn();
    render(
      <ConversationMenu
        muted={false}
        onClose={onClose}
        pinned={false}
        unread={false}
        x={12}
        y={24}
      />,
    );
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    expect(onClose).toHaveBeenCalled();
    render(
      <ConversationMenu
        muted
        onArchive={vi.fn()}
        onClose={onClose}
        onMarkRead={vi.fn()}
        onMute={vi.fn()}
        onPin={vi.fn()}
        pinned
        unread
        x={0}
        y={0}
      />,
    );
    expect(screen.getByRole("menuitem", { name: en.conversations.unmute })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: en.conversations.mark_read })).toBeInTheDocument();
    render(<SwipeActions muted onArchive={vi.fn()} onMarkRead={vi.fn()} onMute={vi.fn()} />);
  });
});
