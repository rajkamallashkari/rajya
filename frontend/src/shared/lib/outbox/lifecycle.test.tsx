import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { messageKeys } from "@/features/conversations/api/keys";
import type { Message } from "@/features/conversations/api/http";
import type { MessagePages } from "@/features/conversations/api/cache";
import { enqueueAndFlush } from "@/shared/lib/outbox/processor";
import { OutboxSendError } from "@/shared/lib/outbox/send";
import { bindOutboxTestHooks, useOutboxLifecycle } from "./lifecycle";
import { OUTBOX_SYNC_FAILED, OUTBOX_SYNC_SUCCESS } from "./worker";

function message(id: number, extras: Partial<Message> = {}): Message {
  return {
    id,
    conversation_id: 1,
    position: Math.abs(id),
    revision: 1,
    kind: "text",
    body: extras.body ?? `m${String(id)}`,
    deleted: false,
    silent: false,
    created_at: "t",
    ...extras,
  };
}

function pages(messages: Message[]): MessagePages {
  return {
    pageParams: [{}],
    pages: [
      {
        messages,
        meta: {
          has_more_after: false,
          has_more_before: false,
          newest_position: messages.at(-1)?.position ?? null,
          oldest_position: messages[0]?.position ?? null,
          pivot_id: null,
        },
      },
    ],
  };
}

function Harness() {
  useOutboxLifecycle();
  return <p>ready</p>;
}

describe("outbox lifecycle", () => {
  it("applies worker messages and processor callbacks", async () => {
    const listeners = new Map<string, (event: MessageEvent) => void>();
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        addEventListener: (type: string, listener: (event: MessageEvent) => void) =>
          listeners.set(type, listener),
        removeEventListener: (type: string) => listeners.delete(type),
      },
    });
    const client = new QueryClient();
    client.setQueryData(
      messageKeys.page(1),
      pages([message(-1, { client_nonce: "gone", body: "pending" })]),
    );
    useAccountsStore.getState().upsertAccount(
      {
        displayName: "Ada",
        hasPasskey: false,
        hasPassword: false,
        id: 1,
        onboarded: true,
        token: "tok",
        username: "ada",
      },
      true,
    );
    render(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>,
    );
    window.dispatchEvent(new Event("online"));
    const onMessage = listeners.get("message");
    onMessage?.({ data: null } as MessageEvent);
    onMessage?.({ data: { type: "other" } } as MessageEvent);
    onMessage?.({
      data: {
        type: OUTBOX_SYNC_SUCCESS,
        clientId: "s1",
        conversationId: 1,
        message: message(8, { body: "from-sw" }),
      },
    } as MessageEvent);
    onMessage?.({
      data: {
        type: OUTBOX_SYNC_FAILED,
        clientId: "gone",
        conversationId: 1,
        reason: "rejected",
      },
    } as MessageEvent);
    await waitFor(() => {
      const cached = client.getQueryData<MessagePages>(messageKeys.page(1));
      expect(cached?.pages[0]?.messages.some((row) => row.body === "from-sw")).toBe(true);
    });

    client.setQueryData(
      messageKeys.page(1),
      pages([message(-3, { client_nonce: "bad", body: "bad" }), message(-4, { client_nonce: "net" })]),
    );
    await enqueueAndFlush(
      1,
      { body: "bad", conversationId: 1, createdAt: "t", id: "bad" },
      {
        send: async () => {
          throw new OutboxSendError("rejected");
        },
        sync: () => undefined,
      },
    );
    await enqueueAndFlush(
      1,
      { body: "net", conversationId: 1, createdAt: "t", id: "net" },
      {
        send: async () => {
          throw new OutboxSendError("network");
        },
        sync: () => undefined,
      },
    );
    await enqueueAndFlush(
      1,
      { body: "ok", conversationId: 1, createdAt: "t", id: "ok" },
      {
        send: async () => message(9, { client_nonce: "ok", body: "sent" }),
        sync: () => undefined,
      },
    );
    await enqueueAndFlush(
      1,
      { body: "ghost", conversationId: 99, createdAt: "t", id: "ghost" },
      {
        send: async () => {
          throw new OutboxSendError("rejected");
        },
        sync: () => undefined,
      },
    );
    await enqueueAndFlush(
      1,
      { body: "fresh", conversationId: 99, createdAt: "t", id: "fresh" },
      {
        send: async () => message(10, { conversation_id: 99, client_nonce: "fresh", body: "fresh" }),
        sync: () => undefined,
      },
    );
    const after = client.getQueryData<MessagePages>(messageKeys.page(1));
    expect(after?.pages[0]?.messages.some((row) => row.client_nonce === "bad" && row.id < 0)).toBe(
      false,
    );
    expect(after?.pages[0]?.messages.some((row) => row.body === "sent")).toBe(true);

    const unbind = bindOutboxTestHooks(1, "1");
    expect(window.__rajyaDrainOutbox).toBeTypeOf("function");
    await window.__rajyaDrainOutbox?.();
    await window.__rajyaDualDrainOutbox?.();
    expect(window.__rajyaWriteSystemEvent?.(1, "member_left", "Grace left")).toEqual(
      expect.objectContaining({ kind: "system", system_event: "member_left", body: "Grace left" }),
    );
    unbind();
    bindOutboxTestHooks(1, undefined)();
  });
});
