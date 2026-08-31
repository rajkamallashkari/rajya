import { describe, expect, it } from "vitest";
import { fetchVapidPublicKey, registerPushSubscription, unregisterPushSubscription } from "./push";
import { setAccessSession } from "@/features/auth/model/access-session";
import { testSession } from "@/test/access-session";

describe("push api", () => {
  it("fetches vapid and registers or unregisters a subscription", async () => {
    setAccessSession(testSession({ token: "tok" }));
    await expect(fetchVapidPublicKey()).resolves.toEqual({ public_key: "vapid-public" });
    await expect(
      registerPushSubscription({ endpoint: "https://push.example/1", keys: { p256dh: "p", auth: "a" } }),
    ).resolves.toEqual({ id: 1, endpoint: "https://push.example/1" });
    await expect(unregisterPushSubscription("https://push.example/1")).resolves.toEqual({ ok: true });
  });
});
