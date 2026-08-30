import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { setAccessSession } from "@/features/auth/model/access-session";
import {
  emptyIdList,
  newerPageParam,
  olderPageParam,
  useEditMessage,
  useJumpToMessage,
  useMessageInfo,
  useMessagePage,
  usePinMessage,
  useReactMessage,
  useSaveMessage,
  useSendMessage,
  useUnsendMessage,
} from "./queries";
import type { MessagePage } from "./http";
import { seedPositions } from "@/shared/lib/api/msw/messaging-store";
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
      expect(screen.queryByText(/nope/)).toBeNull();
    });
    await user.click(screen.getByRole("button", { name: en.messages.menu.edit }));
    await user.click(screen.getByRole("button", { name: en.messages.menu.unsend }));
    await user.click(
      screen.getByRole("button", { name: en.messages.menu.react.replace("{{emoji}}", "👍") }),
    );
    await user.click(screen.getByRole("button", { name: en.messages.menu.pin }));
    await user.click(screen.getByRole("button", { name: en.messages.menu.save }));
    expect(screen.getByText("idle")).toBeInTheDocument();
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
      expect(screen.getByText("0")).toBeInTheDocument();
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
});
