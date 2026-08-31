import { describe, expect, it, vi } from "vitest";
import { createPushSubscription } from "./subscribe";

describe("createPushSubscription", () => {
  it("returns null when permission is denied or the public key is blank", async () => {
    const subscribe = vi.fn();
    const registration = { pushManager: { subscribe } as unknown as PushManager };
    await expect(
      createPushSubscription(registration, "BAAA", {
        permission: "denied",
        requestPermission: async () => "granted",
      }),
    ).resolves.toBeNull();
    await expect(
      createPushSubscription(registration, "", {
        permission: "granted",
        requestPermission: async () => "granted",
      }),
    ).resolves.toBeNull();
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("requests permission when default and subscribes", async () => {
    const toJSON = vi.fn().mockReturnValue({
      endpoint: "https://push.example/1",
      keys: { p256dh: "p", auth: "a" },
    });
    const subscribe = vi.fn().mockResolvedValue({ toJSON });
    const json = await createPushSubscription(
      { pushManager: { subscribe } as unknown as PushManager },
      "YQ",
      { permission: "default", requestPermission: async () => "granted" },
    );
    expect(json?.endpoint).toBe("https://push.example/1");
    expect(subscribe).toHaveBeenCalled();
  });

  it("subscribes immediately when permission is already granted", async () => {
    const subscribe = vi.fn().mockResolvedValue({
      toJSON: () => ({ endpoint: "https://push.example/2", keys: { p256dh: "p", auth: "a" } }),
    });
    await createPushSubscription(
      { pushManager: { subscribe } as unknown as PushManager },
      "YQ",
      { permission: "granted", requestPermission: async () => "denied" },
    );
    expect(subscribe).toHaveBeenCalled();
  });
});
