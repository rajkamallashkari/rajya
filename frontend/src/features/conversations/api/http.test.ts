import { describe, expect, it } from "vitest";
import { setAccessSession } from "@/features/auth/model/access-session";
import { createInvite, pinMessage, reactToMessage, unpinMessage, unreactToMessage } from "./http";
import { testSession } from "@/test/access-session";

describe("conversation message HTTP", () => {
  it("removes reactions and pins after creating them", async () => {
    setAccessSession(testSession());

    await expect(reactToMessage(101, "🚀")).resolves.toMatchObject({ id: 101 });
    await expect(unreactToMessage(101, "🚀")).resolves.toMatchObject({ id: 101 });
    await expect(pinMessage(1, 101)).resolves.toMatchObject({ message_id: 101 });
    await expect(unpinMessage(1, 101)).resolves.toEqual({ ok: true });
    await expect(createInvite(1)).resolves.toMatchObject({ usable: true });
  });
});
