import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetOsmTileBudget } from "@/features/messages/model/osm-tiles";
import {
  bindNumericId,
  ConversationThread,
  buildMessageMenuActions,
  jumpRestoreTop,
  nextInfoId,
  pollResultsId,
  pollVotePayload,
  reactionDetailViews,
  savedReplyViews,
  voteFromThread,
} from "./conversation-thread";
import { commonGroupsFromCache, ProfilePanel } from "./profile-panel";
import { AppProviders } from "@/app/providers";
import { createQueryClient } from "@/shared/lib/query/client";
import { setAccessSession } from "@/features/auth/model/access-session";
import { ADA_DEMO } from "@/features/conversations/model/demo";
import type { Message } from "@/features/conversations/api/http";
import {
  attachPoll,
  findConversation,
  findMessage,
  messagingStore,
  seedPositions,
} from "@/shared/lib/api/msw/messaging-store";
import { en } from "@/shared/lib/i18n/catalog";
import { SHORTCUTS } from "@/shared/lib/shortcuts/constants";
import { resetLayerStore, useLayerStore } from "@/shared/lib/navigation/layer-store";
import { resetSearchStore, useSearchStore } from "@/features/search/store/search-store";
import { SEARCH_FIXTURE_NEEDLE } from "@/features/search/model/constants";
import { testSession } from "@/test/access-session";
import { testCable } from "@/test/fake-cable";
import { server } from "@/test/msw";
import { THREAD_LOAD_OLDER_PX } from "@/features/conversations/model/constants";

afterEach(() => {
  resetOsmTileBudget();
  resetLayerStore();
  resetSearchStore();
});

async function liveThreadReady(text?: string): Promise<void> {
  await screen.findByRole("textbox");
  if (text) {
    expect(screen.getByText(text)).toBeInTheDocument();
  }
}

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
    expect(document.querySelector("[data-conversation-thread]")?.className).toContain(
      "chat-wallpaper",
    );
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

  it("loads a live conversation, sends, and opens message info", { timeout: 15_000 }, async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    const conversation = findConversation(1);
    if (conversation) {
      conversation.wallpaper = { preset: "dusk", dim: 0.1, blur: 0 };
    }
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
    await screen.findByRole("textbox");
    expect(screen.getByText("See you at the gate")).toBeInTheDocument();
    expect(document.querySelector("[data-conversation-thread]")?.getAttribute("style")).toContain(
      "--wallpaper-image",
    );
    const field = screen.getByRole("textbox");
    await user.type(field, "/sticker");
    await user.click(await screen.findByRole("option", { name: /sticker/i }));
    await user.click(await screen.findByRole("button", { name: "wave" }));
    await user.type(field, "/gif");
    await user.click(await screen.findByRole("option", { name: /gif/i }));
    await user.type(screen.getByPlaceholderText(en.picker.search_gifs), "party");
    await user.click(await screen.findByRole("button", { name: "Party" }));
    await user.type(field, "/om");
    expect(await screen.findByRole("option", { name: /omw/i })).toBeInTheDocument();
    await user.clear(field);
    await user.type(field, "/pl");
    expect(await screen.findByRole("option", { name: /plan/i })).toBeInTheDocument();
    await user.clear(field);
    await user.type(field, "/help");
    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
    expect(screen.getByText("/help")).toBeInTheDocument();
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

  it("shows a banner when the viewer blocked the direct-message peer", async () => {
    setAccessSession(testSession());
    server.use(
      http.get("*/api/v1/blocks", () =>
        HttpResponse.json({
          blocks: [
            {
              account: {
                display_name: "Grace Hopper",
                id: 2,
                kind: "human",
                username: "grace",
              },
            },
          ],
        }),
      ),
    );

    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );

    expect(await screen.findByText(en.conversations.blocked_banner)).toBeInTheDocument();
    expect(document.querySelector("[data-blocked-banner]")).not.toBeNull();
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
    const contactCard = document.querySelector("[data-contact-card]");
    if (!contactCard) {
      throw new Error("missing contact card");
    }
    await user.click(
      within(contactCard as HTMLElement).getByRole("button", { name: en.contact.open_profile }),
    );
    expect(useLayerStore.getState().layers.some((layer) => layer.id === "account:2")).toBe(true);
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
    await screen.findByRole("textbox");
    expect(screen.getByText("See you at the gate")).toBeInTheDocument();
    await user.type(screen.getByRole("textbox"), "queued-body");
    await user.keyboard("{Enter}");
    expect(await screen.findByText("queued-body")).toBeInTheDocument();
    expect(document.querySelector("[data-status='queued']")).not.toBeNull();
  });

  it("records and sends a voice note from the live composer", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    const tracks = [{ stop: vi.fn() }];
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: async () => ({ getTracks: () => tracks }) },
    });
    class StubRecorder {
      public ondataavailable: ((event: { data: Blob }) => void) | null = null;
      public onstop: (() => void) | null = null;
      public state = "inactive";
      public static isTypeSupported = (): boolean => true;
      public start(): void {
        this.state = "recording";
      }
      public stop(): void {
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob(["voice"]) });
        this.onstop?.();
      }
      public pause(): void {
        this.state = "paused";
      }
      public resume(): void {
        this.state = "recording";
      }
    }
    vi.stubGlobal("MediaRecorder", StubRecorder);
    vi.stubGlobal(
      "AudioContext",
      class {
        public close = async (): Promise<void> => undefined;
        public createAnalyser = () => ({
          fftSize: 0,
          frequencyBinCount: 4,
          getByteFrequencyData: (data: Uint8Array) => data.fill(128),
        });
        public createMediaStreamSource = () => ({ connect: () => undefined });
      },
    );
    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    await screen.findByRole("textbox");

    await user.click(screen.getByRole("button", { name: en.composer.mic }));
    const send = await screen.findByRole("button", { name: en.composer.send_voice });
    await user.click(send);

    await waitFor(() => {
      expect(document.querySelector("[data-voice-note]")).not.toBeNull();
    });

    const bubbles = document.querySelectorAll("[data-message-bubble]");
    fireEvent.contextMenu(bubbles[bubbles.length - 1] as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.transcribe }));
    await waitFor(() => {
      expect(screen.queryByRole("menuitem", { name: en.messages.menu.transcribe })).toBeNull();
    });
    vi.unstubAllGlobals();
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
    await liveThreadReady("m60");
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
    setAccessSession(testSession());
    render(
      <AppProviders>
        <ProfilePanel accountId="1" conversationId="1" />
      </AppProviders>,
    );
    expect(await screen.findByText(en.contact.open_profile)).toBeInTheDocument();
    render(
      <AppProviders>
        <ProfilePanel accountId="nope" conversationId="1" />
      </AppProviders>,
    );
    expect(document.querySelector("[data-profile-panel]")).not.toBeNull();
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
    expect(
      screen.getByText(en.conversations.profile.members.replace("{{count}}", "1")),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.report.action }));
    expect(await screen.findByRole("button", { name: en.report.submit })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: en.report.submit })).toBeNull();
    });
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

  it("opens group members and cached groups in common from profiles", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    const group = findConversation(2);
    const direct = findConversation(1);
    const peer = direct?.peer;
    if (!group || !peer) {
      throw new Error("missing profile fixtures");
    }
    group.members.push({ account: peer, role: "member" });
    const { rerender } = render(
      <AppProviders>
        <ProfilePanel conversationId="2" />
      </AppProviders>,
    );
    expect(
      await screen.findByText(en.conversations.profile.members.replace("{{count}}", "2")),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: new RegExp(peer.display_name) }));
    expect(useLayerStore.getState().layers.at(-1)).toEqual(
      expect.objectContaining({ accountId: String(peer.id), kind: "profile" }),
    );

    rerender(
      <AppProviders>
        <ProfilePanel conversationId="1" />
      </AppProviders>,
    );
    expect(await screen.findByText(en.conversations.profile.common_groups)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Team/ }));
    expect(useLayerStore.getState().layers).toEqual([
      expect.objectContaining({ conversationId: "2", kind: "conversation" }),
    ]);
  });

  it("derives common groups only from cached memberships", () => {
    const queryClient = createQueryClient();
    expect(commonGroupsFromCache(queryClient, 2)).toEqual([]);
    const direct = findConversation(1);
    const group = findConversation(2);
    if (!direct || !group) {
      throw new Error("missing profile fixtures");
    }
    queryClient.setQueryData(["conversations", "detail", 0], undefined);
    queryClient.setQueryData(["conversations", "detail", direct.id], direct);
    queryClient.setQueryData(["conversations", "list"], { conversations: [group] });
    expect(commonGroupsFromCache(queryClient, 2)).toEqual([]);
  });

  it("opens a report sheet from a peer message", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    await liveThreadReady("Are you free later?");
    const bubble = screen.getByText("Are you free later?").closest("[data-message-bubble]");
    fireEvent.contextMenu(bubble as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.report }));
    expect(await screen.findByRole("button", { name: en.report.submit })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: en.report.submit })).toBeNull();
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
    expect(screen.queryByRole("button", { name: en.calls.start_audio })).toBeNull();
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
    const onTranscribe = vi.fn();
    const voice = buildMessageMenuActions({
      message: {
        id: 6,
        conversation_id: 1,
        position: 6,
        revision: 1,
        kind: "voice",
        body: null,
        deleted: false,
        silent: false,
        created_at: "2026-01-01T12:00:00.000Z",
        attachments: [
          {
            byte_size: 1,
            content_type: "audio/webm",
            id: 12,
            kind: "voice",
            processing_status: "ready",
          },
        ],
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
      onTranscribe,
      onUnsend: () => undefined,
      pinned: [],
      saved: [],
      viewerId: 1,
    });
    voice.onTranscribe?.();
    expect(onTranscribe).toHaveBeenCalledWith(12);
    const transcribed = buildMessageMenuActions({
      message: {
        id: 7,
        conversation_id: 1,
        position: 7,
        revision: 1,
        kind: "voice",
        body: null,
        deleted: false,
        silent: false,
        created_at: "2026-01-01T12:00:00.000Z",
        attachments: [
          {
            byte_size: 1,
            content_type: "audio/webm",
            id: 13,
            kind: "voice",
            processing_status: "ready",
            transcript_status: "ready",
          },
        ],
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
      onTranscribe,
      onUnsend: () => undefined,
      pinned: [],
      saved: [],
      viewerId: 1,
    });
    expect(transcribed.onTranscribe).toBeUndefined();
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
    const reported = buildMessageMenuActions({
      message: {
        id: 3,
        conversation_id: 1,
        position: 3,
        revision: 1,
        kind: "text",
        body: "Hi",
        deleted: false,
        silent: false,
        created_at: "2026-01-01T12:00:00.000Z",
        sender: { id: 2, username: "grace", display_name: "Grace", kind: "human" },
      },
      onCopy: () => undefined,
      onEdit: () => undefined,
      onInfo: () => undefined,
      onPin: () => undefined,
      onReact: () => undefined,
      onReactions: () => undefined,
      onRemind: () => undefined,
      onReport: () => undefined,
      onSave: () => undefined,
      onSelect: () => undefined,
      onUnsend: () => undefined,
      pinned: [],
      saved: [],
      viewerId: 1,
    });
    expect(reported.onReport).toBeDefined();
    const system = buildMessageMenuActions({
      message: {
        id: 4,
        conversation_id: 1,
        position: 4,
        revision: 1,
        kind: "system",
        body: "joined",
        deleted: false,
        silent: false,
        created_at: "2026-01-01T12:00:00.000Z",
        sender: { id: 2, username: "grace", display_name: "Grace", kind: "human" },
      },
      onCopy: () => undefined,
      onEdit: () => undefined,
      onInfo: () => undefined,
      onPin: () => undefined,
      onReact: () => undefined,
      onReactions: () => undefined,
      onRemind: () => undefined,
      onReport: () => undefined,
      onSave: () => undefined,
      onSelect: () => undefined,
      onUnsend: () => undefined,
      pinned: [],
      saved: [],
      viewerId: 1,
    });
    expect(system.onReport).toBeUndefined();
    const bot = buildMessageMenuActions({
      message: {
        id: 5,
        conversation_id: 1,
        position: 5,
        revision: 1,
        kind: "text",
        body: "Hi",
        deleted: false,
        silent: false,
        created_at: "2026-01-01T12:00:00.000Z",
        sender: { id: 9, username: "bot", display_name: "Bot", kind: "bot" },
        metadata: { prompted_by_account_id: 1 } as unknown as Message["metadata"],
      },
      onCopy: () => undefined,
      onEdit: () => undefined,
      onInfo: () => undefined,
      onPin: () => undefined,
      onReact: () => undefined,
      onReactions: () => undefined,
      onRemind: () => undefined,
      onRegenerate: () => undefined,
      onSave: () => undefined,
      onSelect: () => undefined,
      onSuggestReply: () => undefined,
      onTranslate: () => undefined,
      onUnsend: () => undefined,
      pinned: [],
      saved: [],
      viewerId: 1,
    });
    expect(bot.onRegenerate).toBeDefined();
    expect(bot.onSuggestReply).toBeDefined();
    expect(bot.onTranslate).toBeDefined();
    const otherPrompt = buildMessageMenuActions({
      message: {
        id: 5,
        conversation_id: 1,
        position: 5,
        revision: 1,
        kind: "text",
        body: "Hi",
        deleted: false,
        silent: false,
        created_at: "2026-01-01T12:00:00.000Z",
        sender: { id: 9, username: "bot", display_name: "Bot", kind: "bot" },
        metadata: { prompted_by_account_id: 1 } as unknown as Message["metadata"],
      },
      onCopy: () => undefined,
      onEdit: () => undefined,
      onInfo: () => undefined,
      onPin: () => undefined,
      onReact: () => undefined,
      onReactions: () => undefined,
      onRemind: () => undefined,
      onRegenerate: () => undefined,
      onSave: () => undefined,
      onSelect: () => undefined,
      onUnsend: () => undefined,
      pinned: [],
      saved: [],
      viewerId: 2,
    });
    expect(otherPrompt.onRegenerate).toBeUndefined();
    expect(nextInfoId(true, 4)).toBe(4);
    expect(nextInfoId(false, 4)).toBeNull();
    const numeric = vi.fn();
    expect(jumpRestoreTop(40, null)).toBe(40);
    expect(jumpRestoreTop(null, { scrollTop: 12 })).toBe(12);
    expect(jumpRestoreTop(null, null)).toBe(0);
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

  it("regenerates a prompted bot reply and cancels a streaming generation", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    const conversation = findConversation(1);
    conversation?.members.push({
      account: { id: 99, username: "helper", display_name: "Helper", kind: "bot" },
      role: "member",
    });
    messagingStore().messages[1]?.push({
      id: 9001,
      conversation_id: 1,
      position: 9001,
      revision: 1,
      kind: "text",
      body: "Bot hello",
      deleted: false,
      silent: false,
      created_at: "2026-01-01T12:00:00.000Z",
      sender: { id: 99, username: "helper", display_name: "Helper", kind: "bot" },
      metadata: { prompted_by_account_id: 1 } as unknown as Message["metadata"],
    });
    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    await liveThreadReady("Bot hello");
    fireEvent.contextMenu(
      screen.getByText("Bot hello").closest("[data-message-bubble]") as HTMLElement,
    );
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.regenerate }));
    expect(await screen.findByText(en.messages.deleted)).toBeInTheDocument();
    testCable().emit({
      type: "generation_started",
      conversation_id: 1,
      generation_id: "g-1",
      bot_account_id: 99,
      triggered_by_message_id: 9001,
    });
    expect(
      await screen.findByRole("status", { name: en.messages.generation.streaming }),
    ).toBeInTheDocument();
    testCable().emit({
      type: "generation_chunk",
      conversation_id: 1,
      generation_id: "g-1",
      delta: "partial reply",
    });
    expect(await screen.findByText("partial reply")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.messages.generation.cancel }));
    expect(
      testCable().subscriptions.some((subscription) =>
        subscription.performs.some(
          (row) => row.action === "cancel" && row.data?.generation_id === "g-1",
        ),
      ),
    ).toBe(true);
    await waitFor(() => {
      expect(screen.queryByRole("status", { name: en.messages.generation.streaming })).toBeNull();
    });
  });

  it("jumps from search and date, then restores scroll on back", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    });
    window.dispatchEvent(new Event("resize"));
    useLayerStore.getState().openConversation({
      conversationId: "15",
      id: "conversation:15",
      kind: "conversation",
      title: "Adele Goldberg",
    });
    const { container, rerender } = render(
      <AppProviders>
        <ConversationThread conversationId="15" />
      </AppProviders>,
    );
    await liveThreadReady("Ping 79");
    rerender(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    await screen.findByRole("textbox");
    expect(screen.getByText("See you at the gate")).toBeInTheDocument();
    rerender(
      <AppProviders>
        <ConversationThread conversationId="15" />
      </AppProviders>,
    );
    expect(await screen.findByText("Ping 79")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.search.open }));
    await user.click(screen.getByRole("button", { name: en.shell.back }));
    expect(useSearchStore.getState().chatOpen).toBe(false);
    const scroller = document.querySelector("[data-layer-scroll='15']") as HTMLDivElement;
    Object.defineProperty(scroller, "scrollTop", { configurable: true, writable: true, value: 40 });
    fireEvent.scroll(scroller);
    await user.click(screen.getByRole("button", { name: en.search.open }));
    await user.type(screen.getByLabelText(en.search.in_chat), SEARCH_FIXTURE_NEEDLE);
    await waitFor(() => {
      expect(useLayerStore.getState().layers[0]?.focusMessageId).toBeTruthy();
    });
    expect(useSearchStore.getState().chatOpen).toBe(true);
    expect(useSearchStore.getState().jumpStack[0]?.scrollTop).toBe(40);
    await user.click(screen.getByRole("button", { name: en.shell.back }));
    await waitFor(() => {
      expect((document.querySelector("[data-layer-scroll='15']") as HTMLDivElement).scrollTop).toBe(
        40,
      );
    });
    await user.click(screen.getByLabelText(en.search.in_chat));
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");
    await user.click(screen.getByRole("button", { name: en.search.mode_list }));
    await user.click(await screen.findByRole("button", { name: /unique/i }));
    useSearchStore.getState().closeChatSearch();
    expect(screen.queryByLabelText(en.search.jump_date)).not.toBeInTheDocument();
    const dateChip = container.querySelector("[data-date-divider] button");
    expect(dateChip).toBeInstanceOf(HTMLButtonElement);
    await user.click(dateChip as HTMLButtonElement);
    await user.click(screen.getByRole("button", { name: en.search.jump_today }));
    await waitFor(() => {
      expect(useLayerStore.getState().layers[0]?.focusMessageId).toBeTruthy();
    });
    useSearchStore.setState({ jumpStack: [] });
    await user.click(screen.getByRole("button", { name: en.shell.back }));
    expect(useLayerStore.getState().layers).toHaveLength(0);
  });

  it("shows the first-message notice in a new bot DM (DS-1)", async () => {
    setAccessSession(testSession());
    const row = findConversation(1);
    if (row?.peer) {
      row.peer.kind = "bot";
    }
    messagingStore().messages[1] = [];
    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    expect(await screen.findByText(en.bots.memory_notice)).toBeInTheDocument();
  });

  it("rewrites the draft, suggests a reply, translates, and summarizes unread", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    await screen.findByRole("textbox");
    expect(screen.getByText("See you at the gate")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.ai.summarize }));
    expect(await screen.findByText("Ship Friday")).toBeInTheDocument();
    fireEvent.contextMenu(screen.getByLabelText(en.composer.send));
    await user.click(screen.getByRole("menuitem", { name: en.composer.rewrite }));
    const field = screen.getByRole("textbox");
    await user.type(field, "hey");
    fireEvent.contextMenu(screen.getByLabelText(en.composer.send));
    await user.click(screen.getByRole("menuitem", { name: en.composer.rewrite }));
    expect(await screen.findByText(en.ai.provisional)).toBeInTheDocument();
    expect(field).toHaveValue("Hello");
    await user.click(screen.getByRole("button", { name: "casual" }));
    expect(field).toHaveValue("casual");
    const bubbles = document.querySelectorAll("[data-message-bubble]");
    fireEvent.contextMenu(bubbles[0] as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.suggest_reply }));
    expect(await screen.findByRole("button", { name: "On my way" })).toBeInTheDocument();
    fireEvent.contextMenu(bubbles[0] as HTMLElement);
    await user.click(screen.getByRole("menuitem", { name: en.messages.menu.translate }));
    expect(document.querySelector("[data-translation-card]")).not.toBeNull();
  });

  it("attaches files and schedules messages from the send menu", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    let sentPayload: Record<string, unknown> | null = null;
    let scheduledPayload: Record<string, unknown> | null = null;
    server.use(
      http.get("*/api/v1/scheduled_messages", () =>
        HttpResponse.json({
          scheduled_messages: scheduledPayload
            ? [
                {
                  body: "Later",
                  client_nonce: scheduledPayload.client_nonce,
                  conversation_id: 1,
                  created_at: "2026-01-01T12:00:00.000Z",
                  id: 2,
                  scheduled_at: scheduledPayload.scheduled_at,
                  sender_account_id: 1,
                },
              ]
            : [],
        }),
      ),
      http.post("*/api/v1/messages", async ({ request }) => {
        sentPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            body: "With file",
            client_nonce: sentPayload.client_nonce,
            conversation_id: 1,
            created_at: "2026-01-01T12:00:00.000Z",
            deleted: false,
            id: 999,
            kind: "text",
            position: 999,
            revision: 0,
            silent: false,
          },
          { status: 201 },
        );
      }),
      http.post("*/api/v1/scheduled_messages", async ({ request }) => {
        scheduledPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            body: "Later",
            client_nonce: scheduledPayload.client_nonce,
            conversation_id: 1,
            created_at: "2026-01-01T12:00:00.000Z",
            id: 2,
            scheduled_at: scheduledPayload.scheduled_at,
            sender_account_id: 1,
          },
          { status: 201 },
        );
      }),
    );
    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    const field = await screen.findByRole("textbox");

    fireEvent.contextMenu(screen.getByLabelText(en.composer.send));
    await user.click(screen.getByRole("menuitem", { name: en.composer.attach_files }));
    await user.upload(
      screen.getByLabelText(en.composer.attach_files),
      new File(["notes"], "notes.txt", { type: "text/plain" }),
    );
    expect(screen.getByText("notes.txt")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: en.composer.remove_attachment.replace("{{name}}", "notes.txt"),
      }),
    );
    expect(screen.queryByText("notes.txt")).not.toBeInTheDocument();
    await user.upload(
      screen.getByLabelText(en.composer.attach_files),
      new File(["notes"], "notes.txt", { type: "text/plain" }),
    );
    await user.type(field, "With file");
    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(sentPayload).toMatchObject({
        attachment_signed_ids: ["signed"],
        body: "With file",
      });
    });
    expect(screen.queryByText("notes.txt")).not.toBeInTheDocument();

    sentPayload = null;
    await user.upload(
      screen.getByLabelText(en.composer.attach_files),
      new File(["shot"], "shot.png", { type: "image/png" }),
    );
    expect(screen.getByRole("img", { name: "shot.png" })).toHaveAttribute("src", "blob:rajya-test");
    await user.click(screen.getByLabelText(en.composer.send));
    await waitFor(() => {
      expect(sentPayload).toMatchObject({ attachment_signed_ids: ["signed"] });
    });
    expect(sentPayload).not.toHaveProperty("body");

    const picker = screen.getByLabelText(en.composer.attach_files);
    Object.defineProperty(picker, "files", { configurable: true, value: null });
    fireEvent.change(picker);
    expect(document.querySelector("[data-composer-attachments]")).toBeNull();

    fireEvent.contextMenu(screen.getByLabelText(en.composer.send));
    expect(screen.queryByRole("menuitem", { name: en.composer.schedule })).toBeNull();
    fireEvent.keyDown(window, { key: "Escape" });

    await user.type(field, "Later");
    fireEvent.contextMenu(screen.getByLabelText(en.composer.send));
    await user.click(screen.getByRole("menuitem", { name: en.composer.schedule }));
    fireEvent.change(screen.getByLabelText(en.composer.schedule_when), {
      target: { value: "2099-01-01T12:00" },
    });
    await user.click(screen.getByRole("button", { name: en.composer.confirm_schedule }));
    await waitFor(() => {
      expect(scheduledPayload).toMatchObject({
        body: "Later",
        conversation_id: 1,
        scheduled_at: new Date("2099-01-01T12:00").toISOString(),
      });
    });
    expect(field).toHaveValue("");
    const count = await screen.findByRole("button", {
      name: en.composer.scheduled_count_one.replace("{{count}}", "1"),
    });
    await user.click(count);
    expect(screen.getByText("Later")).toBeInTheDocument();
  });

  it("keeps the draft and explains rewrite and schedule failures", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    const failure = {
      error: { code: "upstream_failed", details: {}, message: "Unavailable" },
    };
    server.use(
      http.post("*/api/v1/ai/rewrite", () => HttpResponse.json(failure, { status: 502 })),
      http.post("*/api/v1/scheduled_messages", () => HttpResponse.json(failure, { status: 502 })),
    );
    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    const field = await screen.findByRole("textbox");
    await user.type(field, "Keep me");

    fireEvent.contextMenu(screen.getByLabelText(en.composer.send));
    await user.click(screen.getByRole("menuitem", { name: en.composer.rewrite }));
    expect(await screen.findByText(en.ai.rewrite_failed)).toBeInTheDocument();
    expect(field).toHaveValue("Keep me");

    fireEvent.contextMenu(screen.getByLabelText(en.composer.send));
    await user.click(screen.getByRole("menuitem", { name: en.composer.schedule }));
    fireEvent.change(screen.getByLabelText(en.composer.schedule_when), {
      target: { value: "2099-01-01T12:00" },
    });
    await user.click(screen.getByRole("button", { name: en.composer.confirm_schedule }));
    expect(await screen.findByText(en.composer.schedule_failed)).toBeInTheDocument();
    expect(field).toHaveValue("Keep me");
    expect(screen.getByLabelText(en.composer.schedule_when)).toBeInTheDocument();
  });

  it("keeps the chips and caption when an attachment upload fails", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    server.use(
      http.post("*/api/v1/direct_uploads", () =>
        HttpResponse.json(
          { error: { code: "validation_failed", message: "fail", details: {} } },
          { status: 422 },
        ),
      ),
    );
    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    const field = await screen.findByRole("textbox");
    await user.upload(
      screen.getByLabelText(en.composer.attach_files),
      new File(["notes"], "notes.txt", { type: "text/plain" }),
    );
    await user.type(field, "With file");
    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(field).toHaveValue("With file");
    });
    expect(screen.getByText("notes.txt")).toBeInTheDocument();
  });

  it("starts a call from the live header and hides call buttons on a channel", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const calls = await import("@/features/calls/lib");
    const spy = vi.spyOn(calls, "startCall").mockResolvedValue(undefined);
    setAccessSession(testSession());
    const { unmount } = render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    await screen.findByRole("textbox");
    expect(screen.getByText("See you at the gate")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.calls.start_audio }));
    expect(spy).toHaveBeenCalledWith(1, "audio", 1);
    await user.click(screen.getByRole("button", { name: en.calls.start_video }));
    expect(spy).toHaveBeenCalledWith(1, "video", 1);
    spy.mockRestore();
    unmount();
    const row = findConversation(1);
    if (row) {
      row.kind = "channel";
    }
    setAccessSession(testSession());
    render(
      <AppProviders>
        <ConversationThread conversationId="1" />
      </AppProviders>,
    );
    await screen.findByRole("textbox");
    expect(screen.getByText("See you at the gate")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.calls.start_audio })).toBeNull();
    if (row) {
      row.kind = "direct";
    }
  });
});
