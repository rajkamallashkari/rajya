import { describe, expect, it, vi } from "vitest";
import { OUTBOX_SYNC_TAG } from "@/shared/lib/pwa/constants";
import { registerOutboxSync } from "./sync";

describe("registerOutboxSync", () => {
  it("registers the outbox-sync tag when Background Sync exists", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    await new Promise<void>((resolve) => {
      registerOutboxSync({
        serviceWorker: {
          ready: Promise.resolve({ sync: { register } }),
        },
      } as unknown as Navigator);
      queueMicrotask(() => resolve());
    });
    await Promise.resolve();
    expect(register).toHaveBeenCalledWith(OUTBOX_SYNC_TAG);

    registerOutboxSync({
      serviceWorker: { ready: Promise.resolve({}) },
    } as unknown as Navigator);
    registerOutboxSync({
      serviceWorker: {
        ready: Promise.reject(new Error("nope")),
      },
    } as unknown as Navigator);
    registerOutboxSync(undefined);
    registerOutboxSync({} as Navigator);
    registerOutboxSync();
  });
});
