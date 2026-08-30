import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { setAccessSession } from "@/features/auth/model/access-session";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import {
  emptyIdList,
  newerPageParam,
  olderPageParam,
  useBulkForward,
  useBulkSave,
  useBulkUnsend,
  useClosePoll,
  useConversations,
  useCreateReminder,
  useEditMessage,
  useJumpToMessage,
  useMarkConversationUnread,
  useMessageInfo,
  useMessagePage,
  useMessagePermalink,
  usePinConversation,
  usePinMessage,
  usePollResults,
  useReactMessage,
  useReactionDetails,
  useSaveMessage,
  useSavedReplies,
  useSendMessage,
  useUnsendMessage,
  useVotePoll,
} from "./queries";
import type { MessagePage } from "./http";
import { attachPoll, seedPositions } from "@/shared/lib/api/msw/messaging-store";
import { testSession } from "@/test/access-session";
import { server } from "@/test/msw";
import { en } from "@/shared/lib/i18n/catalog";
import { Button } from "@/shared/ui/button";

function page(meta: Partial<MessagePage["meta"]>): MessagePage {
  return {
    messages: [],
    meta: {
      has_more_before: false,
      has_more_after: false,
      oldest_position: null,
      newest_position: null,
      pivot_id: null,
      ...meta,
    },
  };
}

function EmptyHarness() {
  const page = useMessagePage(9);
  const send = useSendMessage(9);
  return (
    <div>
      <p data-empty-status={page.status}>{page.messages.length}</p>
      <Button onClick={() => send.mutate({ body: "empty-send", client_nonce: "e" })} type="button">
        empty-send
      </Button>
    </div>
  );
}

function Harness() {
  const messages = useMessagePage(1);
  const jump = useJumpToMessage(1, { messageId: 101 });
  const jumpAt = useJumpToMessage(1, { at: "2026-01-01T12:00:00.000Z" });
  const idleJump = useJumpToMessage(1, {});
  const info = useMessageInfo(null);
  const send = useSendMessage(1);
  const edit = useEditMessage(1);
  const unsend = useUnsendMessage(1);
  const react = useReactMessage(1);
  const pin = usePinMessage(1);
  const save = useSaveMessage();
  const vote = useVotePoll(1);
  const close = useClosePoll(1);
  usePollResults(null);
  return (
    <div>
      <p>{messages.messages.map((row) => row.body).join(",")}</p>
      <p data-jump={jump.isSuccess ? "yes" : "no"}>{jump.data?.meta.pivot_id}</p>
      <p data-jump-at={jumpAt.isSuccess ? "yes" : "no"} />
      <p data-idle-jump={idleJump.fetchStatus} />
      <p data-info={info.fetchStatus}>{info.data ? "info" : "idle"}</p>
      <Button onClick={() => send.mutate({ body: "nope", client_nonce: "n" })} type="button">
        {en.composer.send}
      </Button>
      <Button onClick={() => edit.mutate({ body: "nope", id: 102 })} type="button">
        {en.messages.menu.edit}
      </Button>
      <Button onClick={() => unsend.mutate(102)} type="button">
        {en.messages.menu.unsend}
      </Button>
      <Button onClick={() => react.mutate({ emoji: "👍", id: 102 })} type="button">
        {en.messages.menu.react.replace("{{emoji}}", "👍")}
      </Button>
      <Button onClick={() => pin.mutate(102)} type="button">
        {en.messages.menu.pin}
      </Button>
      <Button onClick={() => save.mutate(102)} type="button">
        {en.messages.menu.save}
      </Button>
      <Button onClick={() => vote.mutate({ optionIds: [1], pollId: 7 })} type="button">
        vote
      </Button>
      <Button onClick={() => close.mutate(7)} type="button">
        close-poll
      </Button>
    </div>
  );
}

describe("message queries", () => {
  it("computes cursor params", () => {
    expect(olderPageParam(page({ has_more_before: true, oldest_position: 3 }))).toEqual({
      before: 3,
    });
    expect(olderPageParam(page({ has_more_before: true, oldest_position: null }))).toBeUndefined();
    expect(newerPageParam(page({ has_more_after: true, newest_position: 9 }))).toEqual({
      after: 9,
    });
    expect(newerPageParam(page({ has_more_after: true, newest_position: null }))).toBeUndefined();
  });

  it("returns an empty id list for pin and save placeholders", async () => {
    expect(await emptyIdList()).toEqual([]);
  });

  it("hydrates conversation list and message pages from IndexedDB for the active account", async () => {
    useAccountsStore.getState().upsertAccount(
      {
        displayName: "Ada",
        hasPasskey: true,
        hasPassword: true,
        id: 1,
        onboarded: true,
        token: "tok",
        username: "ada",
      },
      true,
    );

    function HydrateHarness() {
      const list = useConversations();
      const page = useMessagePage(1);
      return (
        <p data-hydrated={String(page.messages.length)}>{list.data?.conversations.length ?? 0}</p>
      );
    }

    render(
      <AppProviders>
        <HydrateHarness />
      </AppProviders>,
    );
    await waitFor(() => {
      expect(document.querySelector("[data-hydrated]")?.textContent).not.toBe("0");
    });
  });

  it("rolls send, react, pin, and save back when the mutation fails", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    server.use(
      http.post("*/api/v1/messages", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
      http.patch("*/api/v1/messages/:id", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
      http.delete("*/api/v1/messages/:id", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
      http.post("*/api/v1/messages/:message_id/reactions", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
      http.post("*/api/v1/conversations/:conversation_id/pins", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
      http.post("*/api/v1/saved_messages", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
      http.post("*/api/v1/polls/:id/vote", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
      http.post("*/api/v1/polls/:id/close", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
    );
    render(
      <AppProviders>
        <Harness />
      </AppProviders>,
    );
    expect(await screen.findByText(/See you at the gate/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("101")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: en.composer.send }));
    await waitFor(() => {
      expect(screen.getByText(/nope/)).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: en.messages.menu.edit }));
    await user.click(screen.getByRole("button", { name: en.messages.menu.unsend }));
    await user.click(
      screen.getByRole("button", { name: en.messages.menu.react.replace("{{emoji}}", "👍") }),
    );
    await user.click(screen.getByRole("button", { name: en.messages.menu.pin }));
    await user.click(screen.getByRole("button", { name: en.messages.menu.save }));
    await user.click(screen.getByRole("button", { name: "vote" }));
    await user.click(screen.getByRole("button", { name: "close-poll" }));
    expect(screen.getByText("idle")).toBeInTheDocument();
  });

  it("optimistically votes and closes a cached poll, then loads results", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    attachPoll(102, {
      id: 7,
      question: "Lunch?",
      allows_multiple: false,
      is_anonymous: false,
      voter_count: 0,
      closed: false,
      options: [{ id: 1, label: "Yes", position: 0, vote_count: 0, selected: false }],
    });

    function PollHarness() {
      const page = useMessagePage(1);
      const vote = useVotePoll(1);
      const close = useClosePoll(1);
      const results = usePollResults(7);
      return (
        <div data-close={close.status} data-vote={vote.status}>
          <p data-loaded={String(page.messages.length)}>{results.data?.question ?? "none"}</p>
          <Button onClick={() => vote.mutate({ optionIds: [1], pollId: 7 })} type="button">
            vote-live
          </Button>
          <Button onClick={() => close.mutate(7)} type="button">
            close-live
          </Button>
        </div>
      );
    }

    const view = render(
      <AppProviders>
        <PollHarness />
      </AppProviders>,
    );
    expect(await screen.findByText("Lunch?")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Lunch?").closest("[data-loaded]")?.getAttribute("data-loaded")).not.toBe(
        "0",
      );
    });
    await user.click(screen.getByRole("button", { name: "vote-live" }));
    await user.click(screen.getByRole("button", { name: "close-live" }));
    await waitFor(() => {
      const root = screen.getByText("Lunch?").closest("[data-close]");
      expect(root?.getAttribute("data-vote")).toBe("success");
      expect(root?.getAttribute("data-close")).toBe("success");
    });
    view.unmount();
  });

  it("assigns the first position when the cached page is empty", async () => {
    const user = userEvent.setup();
    seedPositions(9, 0);
    setAccessSession(testSession());
    server.use(
      http.post("*/api/v1/messages", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
    );
    render(
      <AppProviders>
        <EmptyHarness />
      </AppProviders>,
    );
    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "empty-send" }));
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  it("sends without a session on the optimistic path", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/v1/messages", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
      http.post("*/api/v1/conversations/:conversation_id/pins", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
      http.post("*/api/v1/saved_messages", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
    );
    render(
      <AppProviders>
        <Harness />
      </AppProviders>,
    );
    await user.click(screen.getByRole("button", { name: en.composer.send }));
    await user.click(screen.getByRole("button", { name: en.messages.menu.pin }));
    await user.click(screen.getByRole("button", { name: en.messages.menu.save }));
    await waitFor(() => {
      expect(screen.queryByText(/nope/)).toBeNull();
    });
  });

  it("rolls a rejected send back through the outbox", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    server.use(
      http.post("*/api/v1/messages", () =>
        HttpResponse.json(
          { error: { code: "validation_failed", message: "fail", details: {} } },
          { status: 422 },
        ),
      ),
    );
    render(
      <AppProviders>
        <Harness />
      </AppProviders>,
    );
    expect(await screen.findByText(/See you at the gate/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.composer.send }));
    await waitFor(() => {
      expect(screen.queryByText(/nope/)).toBeNull();
    });
  });

  it("loads a permalink and reaction details, and rolls bulk unsend back", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    server.use(
      http.post("*/api/v1/messages/bulk_unsend", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
      http.post("*/api/v1/messages/bulk_save", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
      http.post("*/api/v1/messages/bulk_forward", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
    );

    function BulkHarness() {
      const page = useMessagePage(1);
      const permalink = useMessagePermalink(101);
      const reactions = useReactionDetails(101);
      const idlePermalink = useMessagePermalink(null);
      const idleReactions = useReactionDetails(null);
      const unsend = useBulkUnsend(1);
      const save = useBulkSave();
      const forward = useBulkForward(1);
      return (
        <div>
          <p data-page-count={page.messages.length}>{page.messages.length}</p>
          <p data-permalink={permalink.isSuccess ? "yes" : "no"}>{permalink.data?.id}</p>
          <p data-reactions={reactions.isSuccess ? "yes" : "no"} />
          <p data-idle-permalink={idlePermalink.fetchStatus} />
          <p data-idle-reactions={idleReactions.fetchStatus} />
          <Button onClick={() => unsend.mutate([101])} type="button">
            bulk-unsend
          </Button>
          <Button onClick={() => save.mutate([101])} type="button">
            bulk-save
          </Button>
          <Button onClick={() => forward.mutate({ messageIds: [101], targetId: 1 })} type="button">
            bulk-forward
          </Button>
        </div>
      );
    }

    render(
      <AppProviders>
        <BulkHarness />
      </AppProviders>,
    );
    await waitFor(() => {
      expect(document.querySelector("[data-page-count]")?.textContent).not.toBe("0");
      expect(screen.getByText("101")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "bulk-unsend" }));
    await user.click(screen.getByRole("button", { name: "bulk-save" }));
    await user.click(screen.getByRole("button", { name: "bulk-forward" }));
    await waitFor(() => {
      expect(screen.getByText("101")).toBeInTheDocument();
    });
  });

  it("rolls pin and unread conversation mutations back when they fail", async () => {
    const user = userEvent.setup();
    setAccessSession(testSession());
    server.use(
      http.post("*/api/v1/conversations/:id/pin", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
      http.post("*/api/v1/conversations/:id/unread", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
    );

    function OrgHarness() {
      const pin = usePinConversation();
      const unread = useMarkConversationUnread();
      const replies = useSavedReplies();
      const remind = useCreateReminder();
      return (
        <div>
          <p>{replies.data?.saved_replies.length ?? 0}</p>
          <Button onClick={() => pin.mutate({ id: 1, pinned: true })} type="button">
            pin-chat
          </Button>
          <Button onClick={() => pin.mutate({ id: 1, pinned: false })} type="button">
            unpin-chat
          </Button>
          <Button onClick={() => unread.mutate({ id: 1, unread: true })} type="button">
            unread-chat
          </Button>
          <Button onClick={() => unread.mutate({ id: 1, unread: false })} type="button">
            read-chat
          </Button>
          <Button
            onClick={() => remind.mutate({ messageId: 101, remindAt: "2099-01-01T09:00:00.000Z" })}
            type="button"
          >
            remind
          </Button>
        </div>
      );
    }

    render(
      <AppProviders>
        <OrgHarness />
      </AppProviders>,
    );
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "pin-chat" }));
    await user.click(screen.getByRole("button", { name: "unpin-chat" }));
    await user.click(screen.getByRole("button", { name: "unread-chat" }));
    await user.click(screen.getByRole("button", { name: "read-chat" }));
    await user.click(screen.getByRole("button", { name: "remind" }));
  });
});
