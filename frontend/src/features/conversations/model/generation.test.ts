import { describe, expect, it } from "vitest";
import type { Message } from "@/features/conversations/api/http";
import {
  canRegenerateBotReply,
  generationMatchesReply,
  generationSenderName,
  promptedByAccountId,
} from "./generation";

function message(extras: Partial<Message> = {}): Message {
  return {
    id: 1,
    conversation_id: 1,
    position: 1,
    revision: 1,
    kind: "text",
    body: "Hi",
    deleted: false,
    silent: false,
    created_at: "2026-01-01T12:00:00.000Z",
    ...extras,
  };
}

describe("generation helpers", () => {
  it("reads prompted-by and regenerate eligibility", () => {
    expect(promptedByAccountId(message())).toBeNull();
    expect(
      promptedByAccountId(
        message({ metadata: { prompted_by_account_id: 0 } as unknown as Message["metadata"] }),
      ),
    ).toBeNull();
    expect(
      promptedByAccountId(
        message({ metadata: { prompted_by_account_id: "x" } as unknown as Message["metadata"] }),
      ),
    ).toBeNull();
    expect(
      promptedByAccountId(
        message({ metadata: { prompted_by_account_id: 4 } as unknown as Message["metadata"] }),
      ),
    ).toBe(4);
    expect(
      promptedByAccountId(
        message({ metadata: { prompted_by_account_id: "7" } as unknown as Message["metadata"] }),
      ),
    ).toBe(7);
    expect(
      canRegenerateBotReply(
        message({
          sender: { id: 9, username: "bot", display_name: "Bot", kind: "bot" },
          metadata: { prompted_by_account_id: 1 } as unknown as Message["metadata"],
        }),
        1,
      ),
    ).toBe(true);
    expect(
      canRegenerateBotReply(
        message({
          sender: { id: 9, username: "bot", display_name: "Bot", kind: "bot" },
          deleted: true,
          metadata: { prompted_by_account_id: 1 } as unknown as Message["metadata"],
        }),
        1,
      ),
    ).toBe(false);
    expect(canRegenerateBotReply(message(), 1)).toBe(false);
  });

  it("matches a persisted reply to the in-flight generation", () => {
    const state = { botAccountId: 9, generationId: "g-1", text: "Hi" };
    expect(
      generationMatchesReply(
        state,
        message({ metadata: { generation_id: "g-1" } as unknown as Message["metadata"] }),
      ),
    ).toBe(true);
    expect(
      generationMatchesReply(
        state,
        message({ sender: { id: 9, username: "bot", display_name: "Bot", kind: "bot" } }),
      ),
    ).toBe(true);
    expect(
      generationMatchesReply(
        state,
        message({ sender: { id: 2, username: "ada", display_name: "Ada", kind: "human" } }),
      ),
    ).toBe(false);
  });

  it("resolves the streaming bubble name from members, peer, or untitled", () => {
    const generation = { botAccountId: 9, generationId: "g-1", text: "" };
    expect(generationSenderName(null, { members: [] }, "Untitled")).toBe("Untitled");
    expect(
      generationSenderName(
        generation,
        {
          members: [
            {
              role: "member",
              account: { id: 9, username: "bot", display_name: "Helper", kind: "bot" },
            },
          ],
        },
        "Untitled",
      ),
    ).toBe("Helper");
    expect(
      generationSenderName(
        generation,
        { members: [], peer: { id: 9, username: "bot", display_name: "PeerBot", kind: "bot" } },
        "Untitled",
      ),
    ).toBe("PeerBot");
    expect(generationSenderName(generation, { members: [] }, "Untitled")).toBe("Untitled");
  });
});
