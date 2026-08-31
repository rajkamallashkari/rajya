import { describe, expect, it } from "vitest";
import { disclosesSharedMemory, isNewBotConversation } from "./disclosure";

describe("bot disclosure helpers", () => {
  it("treats bots and the shared_memory flag as disclosed", () => {
    expect(disclosesSharedMemory({ kind: "bot" })).toBe(true);
    expect(disclosesSharedMemory({ kind: "human", shared_memory: true })).toBe(true);
    expect(disclosesSharedMemory({ kind: "human" })).toBe(false);
  });

  it("is a new bot conversation only for an empty direct bot chat", () => {
    expect(
      isNewBotConversation({ kind: "direct", peer: { kind: "bot" } }, []),
    ).toBe(true);
    expect(
      isNewBotConversation({ kind: "direct", peer: { kind: "bot" } }, [{ kind: "system" }]),
    ).toBe(true);
    expect(
      isNewBotConversation({ kind: "direct", peer: { kind: "bot" } }, [{ kind: "text" }]),
    ).toBe(false);
    expect(isNewBotConversation({ kind: "group", peer: { kind: "bot" } }, [])).toBe(false);
    expect(isNewBotConversation({ kind: "direct", peer: { kind: "human" } }, [])).toBe(false);
  });
});
