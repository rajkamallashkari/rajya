import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetWebPushEndpoint, syncWebPush, usePushSubscription } from "./use-push-subscription";
import { setAccessSession } from "@/features/auth/model/access-session";
import { testSession } from "@/test/access-session";

const fetchVapidPublicKey = vi.fn();
const registerPushSubscription = vi.fn();
const unregisterPushSubscription = vi.fn();
const createPushSubscription = vi.fn();

vi.mock("@/features/auth/api/push", () => ({
  fetchVapidPublicKey: (...args: unknown[]) => fetchVapidPublicKey(...args),
  registerPushSubscription: (...args: unknown[]) => registerPushSubscription(...args),
  unregisterPushSubscription: (...args: unknown[]) => unregisterPushSubscription(...args),
}));

vi.mock("@/shared/lib/pwa/subscribe", () => ({
  createPushSubscription: (...args: unknown[]) => createPushSubscription(...args),
}));

describe("syncWebPush", () => {
  afterEach(() => {
    resetWebPushEndpoint();
    fetchVapidPublicKey.mockReset();
    registerPushSubscription.mockReset();
    unregisterPushSubscription.mockReset();
    createPushSubscription.mockReset();
  });

  it("unregisters the last endpoint when signed out", async () => {
    setAccessSession(testSession());
    fetchVapidPublicKey.mockResolvedValue({ public_key: "YQ" });
    createPushSubscription.mockResolvedValue({
      endpoint: "https://push.example/1",
      keys: { p256dh: "p", auth: "a" },
    });
    registerPushSubscription.mockResolvedValue({ id: 1, endpoint: "https://push.example/1" });
    const ready = { pushManager: {} };
    await syncWebPush(1, { serviceWorker: { ready: Promise.resolve(ready) } } as Navigator, {
      permission: "granted",
      requestPermission: async () => "granted",
    });
    unregisterPushSubscription.mockRejectedValue(new Error("offline"));
    await syncWebPush(null, undefined, {
      permission: "granted",
      requestPermission: async () => "granted",
    });
    expect(unregisterPushSubscription).toHaveBeenCalledWith("https://push.example/1");
  });

  it("no-ops without a worker, vapid key, or complete subscription keys", async () => {
    await syncWebPush(1, {} as Navigator, {
      permission: "granted",
      requestPermission: async () => "granted",
    });
    fetchVapidPublicKey.mockResolvedValue({ public_key: null });
    await syncWebPush(1, { serviceWorker: { ready: Promise.resolve({}) } } as Navigator, {
      permission: "granted",
      requestPermission: async () => "granted",
    });
    fetchVapidPublicKey.mockResolvedValue({ public_key: "YQ" });
    createPushSubscription.mockResolvedValue({ endpoint: "https://x", keys: {} });
    await syncWebPush(1, { serviceWorker: { ready: Promise.resolve({}) } } as Navigator, {
      permission: "granted",
      requestPermission: async () => "granted",
    });
    createPushSubscription.mockResolvedValue({ endpoint: "https://x", keys: { p256dh: "p" } });
    await syncWebPush(1, { serviceWorker: { ready: Promise.resolve({}) } } as Navigator, {
      permission: "granted",
      requestPermission: async () => "granted",
    });
    createPushSubscription.mockResolvedValue({ keys: { p256dh: "p", auth: "a" } });
    await syncWebPush(1, { serviceWorker: { ready: Promise.resolve({}) } } as Navigator, {
      permission: "granted",
      requestPermission: async () => "granted",
    });
    expect(registerPushSubscription).not.toHaveBeenCalled();
  });

  it("swallows fetch errors", async () => {
    fetchVapidPublicKey.mockRejectedValue(new Error("nope"));
    await expect(
      syncWebPush(1, { serviceWorker: { ready: Promise.resolve({}) } } as Navigator, {
        permission: "granted",
        requestPermission: async () => "granted",
      }),
    ).resolves.toBeUndefined();
  });

  it("does nothing when signed out with no prior endpoint", async () => {
    await syncWebPush(null, undefined, {
      permission: "default",
      requestPermission: async () => "default",
    });
    expect(unregisterPushSubscription).not.toHaveBeenCalled();
  });

  it("runs from the hook without Notification", () => {
    renderHook(() => usePushSubscription());
  });

  it("runs from the hook when Notification exists", () => {
    vi.stubGlobal("Notification", {
      permission: "denied",
      requestPermission: async () => "denied",
    });
    renderHook(() => usePushSubscription());
    vi.unstubAllGlobals();
  });
});
