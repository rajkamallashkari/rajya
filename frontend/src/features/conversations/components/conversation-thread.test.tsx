import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import {
  bindNumericId,
  ConversationThread,
  buildMessageMenuActions,
  nextInfoId,
  pollResultsId,
  pollVotePayload,
  reactionDetailViews,
  savedReplyViews,
  voteFromThread,
} from "./conversation-thread";
import { ProfilePanel } from "./profile-panel";
import { AppProviders } from "@/app/providers";
import { setAccessSession } from "@/features/auth/model/access-session";
import { ADA_DEMO } from "@/features/conversations/model/demo";
import {
  attachPoll,
  findConversation,
  findMessage,
  messagingStore,
  seedPositions,
} from "@/shared/lib/api/msw/messaging-store";
import { en } from "@/shared/lib/i18n/catalog";
import { SHORTCUTS } from "@/shared/lib/shortcuts/constants";
import { useLayerStore } from "@/shared/lib/navigation/layer-store";
import { testSession } from "@/test/access-session";
import { testCable } from "@/test/fake-cable";
import { server } from "@/test/msw";
import { THREAD_LOAD_OLDER_PX } from "@/features/conversations/model/constants";

describe("conversation layers", () => {
  it("sends, edits the last message, and opens the profile on the demo path", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <ConversationThread conversationId="ada" />
      </AppProviders>,
    );
    const field = screen.getByRole("textbox");
    await user.type(field, "hello");
    await user.keyboard("{Enter}");
    expect(screen.getByText("hello")).toBeInTheDocument();
    fireEvent.keyDown(field, { key: SHORTCUTS.editLast });
    expect(screen.getByText(en.composer.editing)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.composer.dismiss_edit }));
    fireEvent.keyDown(field, { key: SHORTCUTS.editLast });
    await user.clear(field);
    await user.type(field, "edited");
    await user.keyboard("{Enter}");
    expect(screen.getByText("edited")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.shell.open_profile }));
    expect(useLayerStore.getState().layers.some((layer) => layer.kind === "profile")).toBe(true);
    expect(screen.queryByRole("button", { name: en.shell.back })).not.toBeInTheDocument();
  });

  it("returns nothing for unknown ids and skips edit when the draft is dirty", async () => {
    const { rerender } = render(
      <AppProviders>
        <ConversationThread conversationId="missing" />
      </AppProviders>,
    );
    expect(document.querySelector("[data-conversation-thread]")).toBeNull();
    rerender(
      <AppProviders>
        <ConversationThread conversationId="ada" />
      </AppProviders>,
    );
    rerender(
      <AppProviders>
        <ConversationThread conversationId="notes" />
      </AppProviders>,
    );
    fireEvent.keyDown(screen.getByRole("textbox"), { key: SHORTCUTS.editLast });
    expect(screen.queryByText(en.composer.editing)).toBeNull();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "keep" } });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: SHORTCUTS.editLast });
    expect(screen.queryByText(en.composer.editing)).toBeNull();
    rerender(
      <AppProviders>
        <ProfilePanel conversationId="missing" />
      </AppProviders>,
    );
    expect(document.querySelector("[data-profile-panel]")).toBeNull();
    rerender(
      <AppProviders>
        <ProfilePanel conversationId={ADA_DEMO.id} />
      </AppProviders>,
    );
    expect(screen.getByText(en.shell.profile_subtitle)).toBeInTheDocument();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    });
    window.dispatchEvent(new Event("resize"));
    rerender(
      <AppProviders>
        <ConversationThread conversationId="ada" />
      </AppProviders>,
    );
    expect(screen.getByRole("button", { name: en.shell.back })).toBeInTheDocument();
  });

  it("loads a live conversation, sends, and opens message info", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    expect(await screen.findByText("See you at the gate")).toBeInTheDocument();
    const field = screen.getByRole("textbox");
    await user.type(field, "/om");
    expect(await screen.findByRole("option")).toBeInTheDocument();
    await user.clear(field);
    await user.type(field, "live-hello");
    await user.keyboard("{Enter}");
    expect(await screen.findByText("live-hello")).toBeInTheDocument();
    fireEvent.keyDown(field, { key: SHORTCUTS.editLast });
    expect(screen.getByText(en.composer.editing)).toBeInTheDocument();
    await user.clear(field);
    await user.type(field, "live-edited");
    await user.keyboard("{Enter}");
    expect(await screen.findByText("live-edited")).toBeInTheDocument();
    const bubbles = document.querySelectorAll("[data-message-bubble]");
    fireEvent.contextMenu(bubbles[bubbles.length - 1] as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.copy }));
    expect(writeText).toHaveBeenCalled();
    fireEvent.contextMenu(bubbles[bubbles.length - 1] as HTMLElement);
    await user.click(
      screen.getByRole("button", { name: en.messages.menu.react.replace("{{emoji}}", "👍") }),
    );
    fireEvent.contextMenu(bubbles[bubbles.length - 1] as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.pin }));
    fireEvent.contextMenu(bubbles[bubbles.length - 1] as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.save }));
    fireEvent.contextMenu(bubbles[bubbles.length - 1] as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.edit }));
    expect(screen.getByText(en.composer.editing)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.composer.dismiss_edit }));
    fireEvent.contextMenu(bubbles[bubbles.length - 1] as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.info }));
    expect(await screen.findByText(en.messages.info.title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    fireEvent.contextMenu(bubbles[bubbles.length - 1] as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.remind }));
    expect(await screen.findByText(en.reminders.title)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(en.reminders.when), {
      target: { value: "2099-01-15T09:00" },
    });
    await user.type(screen.getByLabelText(en.reminders.note), "Ping");
    await user.click(screen.getByRole("button", { name: en.reminders.save }));
    fireEvent.contextMenu(bubbles[bubbles.length - 1] as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.reactions }));
    expect(await screen.findByText(en.reactions.title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    fireEvent.contextMenu(bubbles[bubbles.length - 1] as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.unsend }));
    expect(await screen.findByText(en.messages.deleted)).toBeInTheDocument();
    const remaining = document.querySelectorAll("[data-message-bubble]");
    fireEvent.contextMenu(remaining[remaining.length - 1] as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.select }));
    expect(document.querySelector("[data-selection-toolbar]")).not.toBeNull();
    fireEvent.contextMenu(remaining[remaining.length - 1] as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.select }));
    await user.click(screen.getByRole("button", { name: en.selection.select_all }));
    await user.click(screen.getByRole("button", { name: en.selection.copy }));
    await user.click(screen.getByRole("button", { name: en.selection.clear }));
    fireEvent.contextMenu(remaining[remaining.length - 1] as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.select }));
    await user.click(screen.getByRole("button", { name: en.selection.forward }));
    fireEvent.contextMenu(remaining[remaining.length - 1] as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.select }));
    await user.click(screen.getByRole("button", { name: en.selection.save }));
    fireEvent.contextMenu(remaining[remaining.length - 1] as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.select }));
    await user.click(screen.getByRole("button", { name: en.selection.delete }));
    expect(await screen.findByText(en.messages.deleted)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.shell.open_profile }));
    expect(useLayerStore.getState().layers.some((layer) => layer.kind === "profile")).toBe(true);
  });

  it("votes in a live poll, opens results, and renders location and contact cards", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    attachPoll(102, {
      id: 8,
      question: "Gate?",
      allows_multiple: false,
      is_anonymous: false,
      voter_count: 0,
      closed: false,
      options: [{ id: 1, label: "Yes", position: 0, vote_count: 0, selected: false }],
    });
    const row = findMessage(101);
    if (row) {
      row.location = { latitude: "1", longitude: "2", accuracy_m: null, label: "Cafe" };
      row.contacts = [{ display_name: "Priya", position: 0, contact_account_id: 2 }];
    }
    const view = render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    expect(await screen.findByText("Gate?")).toBeInTheDocument();
    expect(document.querySelector("[data-location-card]")).not.toBeNull();
    expect(document.querySelector("[data-contact-card]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Yes" }));
    await user.click(screen.getByRole("button", { name: en.polls.results }));
    expect(await screen.findByText(en.polls.results_title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    await waitFor(() => {
      expect(screen.queryByText(en.polls.results_title)).toBeNull();
    });
    view.unmount();
  });

  it("shows queued ticks while a live send is in flight", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    server.use(http.post("*/api/v1/messages", () => new Promise(() => undefined)));
    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    expect(await screen.findByText("See you at the gate")).toBeInTheDocument();
    await user.type(screen.getByRole("textbox"), "queued-body");
    await user.keyboard("{Enter}");
    expect(await screen.findByText("queued-body")).toBeInTheDocument();
    expect(document.querySelector("[data-status='queued']")).not.toBeNull();
  });

  it("skips edit-last when the live thread has no sent body", async () => {
    messagingStore().messages[3] = [
      {
        id: 301,
        conversation_id: 3,
        position: 1,
        revision: 1,
        kind: "text",
        body: null,
        deleted: false,
        silent: false,
        created_at: "2026-01-01T12:00:00.000Z",
      },
    ];
    render(
      <AppProviders>
        <ConversationThread conversationId="3" />
      </AppProviders>,
    );
    expect(await screen.findByLabelText(en.conversations.untitled)).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("textbox"), { key: SHORTCUTS.editLast });
    expect(screen.queryByText(en.composer.editing)).toBeNull();
  });

  it("loads older messages on scroll", async () => {
    seedPositions(1, 60);
    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    expect(await screen.findByText("m60")).toBeInTheDocument();
    expect(screen.queryByText("m1")).not.toBeInTheDocument();
    const scroller = document.querySelector("[data-layer-scroll='1']") as HTMLDivElement;
    Object.defineProperty(scroller, "scrollTop", { configurable: true, writable: true, value: 0 });
    fireEvent.scroll(scroller);
    fireEvent.scroll(scroller);
    expect(await screen.findByText("m1")).toBeInTheDocument();
    Object.defineProperty(scroller, "scrollTop", {
      configurable: true,
      writable: true,
      value: THREAD_LOAD_OLDER_PX + 1,
    });
    fireEvent.scroll(scroller);
  });

  it("jumps to a focused message outside the newest page", async () => {
    setAccessSession(testSession());
    seedPositions(1, 60);
    useLayerStore.getState().openConversation({
      conversationId: "1",
      focusMessageId: "1",
      id: "conversation:1",
      kind: "conversation",
      title: "Ada",
    });
    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    expect(await screen.findByText("m1")).toBeInTheDocument();
  });

  it("renders nothing for a missing live conversation", async () => {
    render(
      <AppProviders>
        <ConversationThread conversationId="999" />
      </AppProviders>,
    );
    await waitFor(() => {
      expect(document.querySelector("[data-conversation-thread]")).toBeNull();
    });
    render(
      <AppProviders>
        <ProfilePanel conversationId="999" />
      </AppProviders>,
    );
    await waitFor(() => {
      expect(document.querySelector("[data-profile-panel]")).toBeNull();
    });
    render(
      <AppProviders>
        <ProfilePanel conversationId="1" />
      </AppProviders>,
    );
    expect(await screen.findByText(en.shell.profile_subtitle)).toBeInTheDocument();
  });

  it("shows invite management on a live group and a profile QR on a direct", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const { rerender } = render(
      <AppProviders>
        <ProfilePanel conversationId="2" />
      </AppProviders>,
    );
    expect(await screen.findByText(en.invites.manage)).toBeInTheDocument();
    rerender(
      <AppProviders>
        <ProfilePanel conversationId="1" />
      </AppProviders>,
    );
    expect(await screen.findByRole("button", { name: en.invites.profile_qr })).toBeInTheDocument();
    expect(screen.queryByText(en.invites.manage)).toBeNull();
    await user.click(screen.getByRole("button", { name: en.invites.profile_qr }));
    expect(document.querySelector("[data-qr-grid]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.qr.copy }));
    expect(writeText).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    await waitFor(() => {
      expect(document.querySelector("[data-qr-grid]")).toBeNull();
    });
  });

  it("shows a loading profile while the conversation is in flight", async () => {
    setAccessSession(testSession());
    server.use(
      http.get("*/api/v1/conversations/:id", async () => {
        await delay(80);
        return HttpResponse.json(findConversation(1));
      }),
    );
    render(
      <AppProviders>
        <ProfilePanel conversationId="1" />
      </AppProviders>,
    );
    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(await screen.findByText(en.shell.profile_subtitle)).toBeInTheDocument();
  });

  it("renders nothing when the live conversation request fails", async () => {
    server.use(
      http.get("*/api/v1/conversations/:id", () =>
        HttpResponse.json(
          { error: { code: "not_found", message: "not_found", details: {} } },
          { status: 404 },
        ),
      ),
    );
    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    await waitFor(() => {
      expect(document.querySelector("[data-conversation-thread]")).toBeNull();
    });
  });

  it("renders nothing when the message page fails", async () => {
    server.use(
      http.get("*/api/v1/conversations/:conversation_id/messages", () =>
        HttpResponse.json(
          { error: { code: "server", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
    );
    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    await waitFor(() => {
      expect(document.querySelector("[data-conversation-thread]")).toBeNull();
    });
  });

  it("renders a sent-only demo thread", () => {
    render(
      <AppProviders>
        <ConversationThread conversationId="sent-only" />
      </AppProviders>,
    );
    expect(screen.getByText("solo")).toBeInTheDocument();
    expect(screen.getByText("Solo")).toBeInTheDocument();
  });

  it("shows a slow-mode hint above the composer", async () => {
    setAccessSession(testSession());
    const row = findConversation(1);
    if (row) {
      row.slow_mode_seconds = 10;
    }
    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    expect(
      await screen.findByText(en.conversations.slow_mode.hint.replace("{{seconds}}", "10")),
    ).toBeInTheDocument();
  });

  it("builds an empty menu when the message is missing", () => {
    expect(
      buildMessageMenuActions({
        message: undefined,
        onCopy: () => undefined,
        onEdit: () => undefined,
        onInfo: () => undefined,
        onPin: () => undefined,
        onReact: () => undefined,
        onReactions: () => undefined,
        onRemind: () => undefined,
        onSave: () => undefined,
        onSelect: () => undefined,
        onUnsend: () => undefined,
        pinned: [],
        saved: [],
        viewerId: 1,
      }),
    ).toEqual({});
    const actions = buildMessageMenuActions({
      message: {
        id: 1,
        conversation_id: 1,
        position: 1,
        revision: 1,
        kind: "text",
        body: null,
        deleted: true,
        silent: false,
        created_at: "2026-01-01T12:00:00.000Z",
      },
      onCopy: () => undefined,
      onEdit: () => undefined,
      onInfo: () => undefined,
      onPin: () => undefined,
      onReact: () => undefined,
      onReactions: () => undefined,
      onRemind: () => undefined,
      onSave: () => undefined,
      onSelect: () => undefined,
      onUnsend: () => undefined,
      pinned: [],
      saved: [],
      viewerId: 1,
    });
    expect(actions.onCopy).toBeUndefined();
    expect(actions.onEdit).toBeUndefined();
    const restricted = buildMessageMenuActions({
      message: {
        id: 2,
        conversation_id: 1,
        position: 2,
        revision: 1,
        kind: "text",
        body: "Hi",
        deleted: false,
        silent: false,
        created_at: "2026-01-01T12:00:00.000Z",
      },
      onCopy: () => undefined,
      onEdit: () => undefined,
      onInfo: () => undefined,
      onPin: () => undefined,
      onReact: () => undefined,
      onReactions: () => undefined,
      onRemind: () => undefined,
      onSave: () => undefined,
      onSelect: () => undefined,
      onUnsend: () => undefined,
      pinned: [],
      restrictForwarding: true,
      saved: [],
      viewerId: 1,
    });
    expect(restricted.onCopy).toBeUndefined();
    expect(restricted.hasText).toBe(false);
    expect(nextInfoId(true, 4)).toBe(4);
    expect(nextInfoId(false, 4)).toBeNull();
    const numeric = vi.fn();
    bindNumericId(numeric)("12", ["2"]);
    expect(numeric).toHaveBeenCalledWith(12, ["2"]);
    expect(savedReplyViews(undefined)).toEqual([]);
    expect(savedReplyViews([{ body: "On my way", id: 1, shortcut: "/omw" }])).toEqual([
      { body: "On my way", id: "1", shortcut: "/omw" },
    ]);
    expect(reactionDetailViews(undefined)).toEqual([]);
    expect(reactionDetailViews([{ account: { display_name: "Ada", id: 1 }, emoji: "👍" }])).toEqual(
      [{ accountId: "1", emoji: "👍", name: "Ada" }],
    );
    expect(pollVotePayload([], 1, ["2"])).toBeNull();
    expect(pollResultsId([], 1)).toBeNull();
    const mutate = vi.fn();
    voteFromThread([], 1, ["2"], mutate);
    expect(mutate).not.toHaveBeenCalled();
    const withPoll = [
      {
        id: 9,
        conversation_id: 1,
        position: 1,
        revision: 1,
        kind: "text",
        body: null,
        deleted: false,
        silent: false,
        created_at: "2026-01-01T12:00:00.000Z",
        poll: {
          id: 8,
          question: "Q",
          allows_multiple: false,
          is_anonymous: false,
          voter_count: 0,
          closed: false,
          options: [],
        },
      },
    ];
    expect(pollResultsId(withPoll, 9)).toBe(8);
    expect(pollVotePayload(withPoll, 9, ["3"])).toEqual({ optionIds: [3], pollId: 8 });
    voteFromThread(withPoll, 9, ["3"], mutate);
    expect(mutate).toHaveBeenCalledWith({ optionIds: [3], pollId: 8 });
  });

  it("wires live ticks, typing bubbles, and system event copy", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    messagingStore().messages[1] = [
      ...(messagingStore().messages[1] ?? []),
      {
        id: 198,
        conversation_id: 1,
        position: 98,
        revision: 1,
        kind: "system",
        system_event: "member_left",
        body: "Grace left",
        deleted: false,
        silent: false,
        created_at: "2026-01-01T13:00:00.000Z",
      },
    ];
    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    expect(await screen.findByText("Grace left")).toHaveAttribute(
      "data-system-message",
      "member_left",
    );
    await user.type(screen.getByRole("textbox"), "tick-body");
    await user.keyboard("{Enter}");
    const sent = await screen.findByText("tick-body");
    expect(sent.closest("[data-message-bubble]")).toHaveAttribute("data-status", "sent");
    testCable().emit({
      type: "typing",
      conversation_id: 1,
      account_id: 9,
      activity: "uploading_media",
      display_name: "Priya",
    });
    expect(
      await screen.findByRole("status", { name: en.messages.activity.uploading_media }),
    ).toHaveAttribute("data-activity", "uploading_media");
  });
});
