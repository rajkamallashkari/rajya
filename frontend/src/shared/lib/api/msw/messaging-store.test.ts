import { describe, expect, it } from "vitest";
import {
  appendSent,
  buildMessages,
  findConversation,
  findMessage,
  infoFor,
  MESSAGE_STAMP,
  pageFor,
  patchMessage,
  reactStoredMessage,
  resetMessagingStore,
  seedPositions,
  tombstoneMessage,
  voteStoredPoll,
  closeStoredPoll,
  attachPoll,
  findPoll,
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
  });
});
