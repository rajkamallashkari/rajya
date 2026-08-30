import { describe, expect, it, vi } from "vitest";
import {
  appendSent,
  appendSystemEvent,
  buildMessages,
  findConversation,
  findMessage,
  infoFor,
  ingestRemoteMessage,
  listenForMswStoreSync,
  MESSAGE_STAMP,
  pageFor,
  patchMessage,
  reactStoredMessage,
  resetMessagingStore,
  seedPositions,
  setConversationTicks,
  tombstoneMessage,
  voteStoredPoll,
  closeStoredPoll,
  attachPoll,
  findPoll,
  VIEWER,
} from "./messaging-store";

describe("messaging store", () => {
  it("pages, mutates, and reports info for stored messages", () => {
    expect(buildMessages(1, 99)).toEqual([]);
    expect(findConversation(999)).toBeUndefined();
    expect(findMessage(0)).toBeUndefined();
    expect(pageFor(1, { around_id: 0 })).toBeNull();
    expect(pageFor(99, { around_at: MESSAGE_STAMP })?.messages).toEqual([]);
    seedPositions(9, 0);
    expect(pageFor(9)?.messages).toEqual([]);
    const sent = appendSent(1, "hi");
    expect(sent.client_nonce).toBeNull();
    expect(appendSent(1, "hi", sent.client_nonce ?? "nonce-dup")).toBeDefined();
    const first = appendSent(1, "once", "nonce-dup");
    expect(appendSent(1, "twice", "nonce-dup").id).toBe(first.id);
    const orphan = appendSent(99, "orphan");
    expect(orphan.position).toBe(1);
    expect(infoFor(sent.id)?.delivered).toHaveLength(1);
    expect(infoFor(101)?.delivered).toEqual([]);
    expect(infoFor(0)).toBeNull();
    expect(patchMessage(0, "x")).toBeNull();
    expect(tombstoneMessage(0)).toBeNull();
    expect(reactStoredMessage(0)).toBeNull();
    expect(reactStoredMessage(sent.id)?.revision).toBe(2);
    expect(voteStoredPoll(0, [])).toBeNull();
    expect(closeStoredPoll(0)).toBeNull();
    expect(findPoll(0)).toBeUndefined();
    attachPoll(sent.id, {
      id: 3,
      question: "Q",
      allows_multiple: false,
      is_anonymous: false,
      voter_count: 0,
      closed: false,
      options: [{ id: 1, label: "A", position: 0, vote_count: 0, selected: false }],
    });
    expect(voteStoredPoll(3, [1])?.poll?.options[0]?.selected).toBe(true);
    expect(closeStoredPoll(3)?.poll?.closed).toBe(true);
    expect(findPoll(3)?.question).toBe("Q");
    resetMessagingStore();
    expect(findConversation(1)?.id).toBe(1);
    const system = appendSystemEvent(1, "member_left", "Grace left");
    expect(system).toMatchObject({ kind: "system", system_event: "member_left", body: "Grace left" });
    expect(findConversation(1)?.last_message?.kind).toBe("system");
    const fromAda = appendSent(1, "from-ada");
    setConversationTicks(1, "read", VIEWER.id);
    expect(fromAda.tick).toBe("sent");
    setConversationTicks(1, "read", 2);
    expect(findMessage(fromAda.id)?.tick).toBe("read");
    setConversationTicks(99, "delivered", 2);
  });

  it("ingests remote messages and store-sync ticks when MSW is on", () => {
    const listeners: Array<(event: MessageEvent<unknown>) => void> = [];
    vi.stubEnv("VITE_MSW", "1");
    vi.stubGlobal(
      "BroadcastChannel",
      class {
        public onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
        public postMessage(data: unknown): void {
          for (const listener of listeners) {
            listener({ data } as MessageEvent<unknown>);
          }
        }
        public close(): void {
          return undefined;
        }
        constructor() {
          listeners.push((event) => this.onmessage?.(event));
        }
      },
    );
    const stop = listenForMswStoreSync();
    const remote = appendSent(1, "from-other");
    ingestRemoteMessage(remote);
    ingestRemoteMessage({ ...remote, body: "dup-id" });
    ingestRemoteMessage({
      id: 9001,
      conversation_id: 1,
      position: 90,
      revision: 1,
      kind: "text",
      body: "peer",
      deleted: false,
      silent: false,
      created_at: MESSAGE_STAMP,
      client_nonce: "n-1",
      sender: { id: 2, username: "grace", display_name: "Grace", kind: "human" },
    });
    ingestRemoteMessage({
      id: 9002,
      conversation_id: 1,
      position: 91,
      revision: 1,
      kind: "text",
      body: "peer-dup",
      deleted: false,
      silent: false,
      created_at: MESSAGE_STAMP,
      client_nonce: "n-1",
      sender: { id: 2, username: "grace", display_name: "Grace", kind: "human" },
    });
    ingestRemoteMessage({
      id: 1,
      conversation_id: 99,
      position: 1,
      revision: 1,
      kind: "text",
      body: "orphan-chat",
      deleted: false,
      silent: false,
      created_at: MESSAGE_STAMP,
    });
    ingestRemoteMessage({
      id: 9003,
      conversation_id: 1,
      position: 92,
      revision: 1,
      kind: "text",
      body: null,
      deleted: false,
      silent: false,
      created_at: MESSAGE_STAMP,
    });
    expect(findMessage(9003)?.body).toBeNull();
    expect(findMessage(9001)?.body).toBe("peer");
    expect(findMessage(1)?.body).toBe("orphan-chat");
    setConversationTicks(1, "delivered", 2);
    appendSystemEvent(100, "member_joined", "Ada joined");
    const channel = new BroadcastChannel("rajya:msw-store");
    channel.postMessage({ type: "nope" });
    channel.postMessage({ type: "ticks", actorId: 2, conversationId: 1, tick: "read" });
    channel.close();
    stop();
    listenForMswStoreSync()();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
});
