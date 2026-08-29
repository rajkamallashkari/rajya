import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bufferToBase64url } from "@/features/auth/lib/webauthn";
import { setAccessSession } from "@/features/auth/model/access-session";
import { LOCK_STORAGE } from "@/features/auth/model/lock-thresholds";
import * as apiClient from "@/shared/lib/api/client";
import {
  computeInitialLockedIds,
  readLockedAccountIds,
  resetLockStore,
  useLockStore,
} from "./lock-store";

const post = vi.fn();

function bytes(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer;
}

function session(accountId = 1) {
  setAccessSession({
    accountId,
    hasPasskey: true,
    hasPassword: true,
    token: "tok",
    username: "ada",
  });
}

function fakeCredential(): PublicKeyCredential {
  return {
    id: "cred",
    rawId: bytes("raw"),
    type: "public-key",
    response: {
      authenticatorData: bytes("ad"),
      clientDataJSON: bytes("cd"),
      signature: bytes("sig"),
      userHandle: null,
    },
  } as unknown as PublicKeyCredential;
}

function mockClient(): void {
  vi.spyOn(apiClient, "createApiClient").mockReturnValue({
    POST: post,
  } as unknown as ReturnType<typeof apiClient.createApiClient>);
}

describe("lock-store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    window.localStorage.clear();
    setAccessSession(null);
    resetLockStore();
    post.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("reads persisted ids, migrates the legacy flag, and ignores junk", () => {
    expect(readLockedAccountIds()).toEqual([]);
    window.localStorage.setItem(LOCK_STORAGE.lockedAccountIds, "not-json");
    expect(readLockedAccountIds()).toEqual([]);
    window.localStorage.setItem(LOCK_STORAGE.lockedAccountIds, '{"id":1}');
    expect(readLockedAccountIds()).toEqual([]);
    window.localStorage.setItem(LOCK_STORAGE.lockedAccountIds, '[1,"x",2]');
    expect(readLockedAccountIds()).toEqual([1, 2]);
    expect(computeInitialLockedIds()).toEqual([1, 2]);

    window.localStorage.removeItem(LOCK_STORAGE.lockedAccountIds);
    window.localStorage.setItem("appLocked", "true");
    expect(computeInitialLockedIds()).toEqual([]);
    session(9);
    window.localStorage.setItem("appLocked", "true");
    expect(computeInitialLockedIds()).toEqual([9]);
    expect(window.localStorage.getItem("appLocked")).toBeNull();
  });

  it("locks on boot when the hidden timestamp is past the threshold", () => {
    session();
    window.localStorage.setItem(LOCK_STORAGE.threshold, "bogus");
    expect(computeInitialLockedIds()).toEqual([]);
    window.localStorage.setItem(LOCK_STORAGE.threshold, "1m");
    window.localStorage.setItem(LOCK_STORAGE.hiddenAt, "nope");
    expect(computeInitialLockedIds()).toEqual([]);
    window.localStorage.setItem(LOCK_STORAGE.hiddenAt, String(1_000_000 - 59_000));
    expect(computeInitialLockedIds()).toEqual([]);
    window.localStorage.setItem(LOCK_STORAGE.hiddenAt, String(1_000_000 - 60_000));
    expect(computeInitialLockedIds()).toEqual([1]);
    resetLockStore();
    expect(useLockStore.getState().locked).toBe(true);
    window.localStorage.setItem(LOCK_STORAGE.lockedAccountIds, "[99]");
    resetLockStore();
    expect(useLockStore.getState().locked).toBe(false);
    window.localStorage.removeItem(LOCK_STORAGE.lockedAccountIds);
    setAccessSession(null);
    expect(computeInitialLockedIds()).toEqual([]);
  });

  it("locks, syncs, and unlocks per account", () => {
    useLockStore.getState().lock();
    expect(useLockStore.getState().locked).toBe(false);
    session(3);
    resetLockStore();
    useLockStore.getState().lock();
    expect(useLockStore.getState().locked).toBe(true);
    expect(useLockStore.getState().isAccountLocked(3)).toBe(true);
    useLockStore.getState().lock();
    expect(readLockedAccountIds()).toEqual([3]);
    session(4);
    useLockStore.getState().syncWithActiveAccount();
    expect(useLockStore.getState().locked).toBe(false);
    useLockStore.getState().lock();
    expect(readLockedAccountIds()).toEqual([3, 4]);
    useLockStore.getState().unlockAccount(4);
    expect(useLockStore.getState().locked).toBe(false);
    expect(readLockedAccountIds()).toEqual([3]);
    session(3);
    useLockStore.getState().syncWithActiveAccount();
    expect(useLockStore.getState().locked).toBe(true);
    useLockStore.getState().forceUnlock();
    expect(useLockStore.getState().locked).toBe(false);
    expect(readLockedAccountIds()).toEqual([]);
    expect(window.localStorage.getItem(LOCK_STORAGE.hiddenAt)).toBeNull();
  });

  it("records hide time and locks after the configured threshold", () => {
    session();
    resetLockStore();
    useLockStore.getState().setThreshold("never");
    useLockStore.getState().onVisibilityHidden();
    useLockStore.getState().onVisibilityVisible();
    expect(useLockStore.getState().locked).toBe(false);

    useLockStore.getState().setThreshold("30s");
    window.localStorage.removeItem(LOCK_STORAGE.hiddenAt);
    useLockStore.getState().onVisibilityVisible();
    expect(useLockStore.getState().locked).toBe(false);

    useLockStore.getState().onVisibilityHidden();
    vi.setSystemTime(1_000_000 + 29_000);
    useLockStore.getState().onVisibilityVisible();
    expect(useLockStore.getState().locked).toBe(false);

    vi.setSystemTime(1_000_000 + 30_000);
    setAccessSession(null);
    useLockStore.getState().onVisibilityVisible();
    expect(useLockStore.getState().locked).toBe(false);

    session();
    useLockStore.getState().onVisibilityVisible();
    expect(useLockStore.getState().locked).toBe(true);
    expect(readLockedAccountIds()).toEqual([1]);
    useLockStore.getState().onVisibilityVisible();
    expect(readLockedAccountIds()).toEqual([1]);
  });

  it("unlocks with a passkey assertion", async () => {
    session();
    resetLockStore();
    useLockStore.getState().lock();
    mockClient();
    const get = vi.fn().mockResolvedValue(fakeCredential());
    Object.defineProperty(navigator, "credentials", { configurable: true, value: { get } });
    post
      .mockResolvedValueOnce({
        data: {
          challenge: bufferToBase64url(bytes("chal")),
          allowCredentials: [
            { id: bufferToBase64url(bytes("one")), type: "public-key" },
            { id: bufferToBase64url(bytes("two")) },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { ok: true } });
    await expect(useLockStore.getState().unlockWithPasskey()).resolves.toBeNull();
    expect(useLockStore.getState().locked).toBe(false);
    expect(get).toHaveBeenCalledWith({
      publicKey: expect.objectContaining({ userVerification: "required" }),
    });
  });

  it("treats missing allowCredentials as empty and maps passkey failures", async () => {
    session();
    resetLockStore();
    useLockStore.getState().lock();
    mockClient();
    const get = vi.fn();
    Object.defineProperty(navigator, "credentials", { configurable: true, value: { get } });
    post.mockResolvedValue({ data: { challenge: bufferToBase64url(bytes("chal")) } });

    get.mockResolvedValueOnce(null);
    await expect(useLockStore.getState().unlockWithPasskey()).resolves.toBe("auth.lock.failed");

    get.mockRejectedValueOnce(Object.assign(new Error("denied"), { name: "NotAllowedError" }));
    await expect(useLockStore.getState().unlockWithPasskey()).resolves.toBeNull();
    expect(useLockStore.getState().unlockErrorKey).toBeNull();

    get.mockResolvedValue(fakeCredential());
    post
      .mockResolvedValueOnce({ data: { challenge: bufferToBase64url(bytes("chal")) } })
      .mockResolvedValueOnce({ error: { error: { code: "unauthenticated" } } });
    await expect(useLockStore.getState().unlockWithPasskey()).resolves.toBe("auth.lock.cloned");

    post
      .mockResolvedValueOnce({ data: { challenge: bufferToBase64url(bytes("chal")) } })
      .mockResolvedValueOnce({ error: {} });
    await expect(useLockStore.getState().unlockWithPasskey()).resolves.toBe("auth.lock.failed");
  });

  it("unlocks with a password and maps verify failures", async () => {
    session();
    resetLockStore();
    useLockStore.getState().lock();
    mockClient();
    post.mockResolvedValueOnce({ data: { ok: true } });
    await expect(useLockStore.getState().unlockWithPassword("secret12")).resolves.toBeNull();
    expect(useLockStore.getState().locked).toBe(false);

    useLockStore.getState().lock();
    post.mockResolvedValueOnce({ error: { error: { code: "unauthenticated" } } });
    await expect(useLockStore.getState().unlockWithPassword("nope")).resolves.toBe(
      "auth.lock.password_incorrect",
    );
    post.mockResolvedValueOnce({ error: {} });
    await expect(useLockStore.getState().unlockWithPassword("nope")).resolves.toBe(
      "auth.lock.failed",
    );
  });
});
