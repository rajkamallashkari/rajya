import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setAccessSession } from "@/features/auth/model/access-session";
import * as apiClient from "@/shared/lib/api/client";
import { assertLock, fetchLockOptions, verifyPasswordLock } from "./lock";

const post = vi.fn();

describe("lock api", () => {
  beforeEach(() => {
    post.mockReset();
    setAccessSession(null);
    vi.spyOn(apiClient, "createApiClient").mockReturnValue({
      POST: post,
    } as unknown as ReturnType<typeof apiClient.createApiClient>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches lock options with a bearer token", async () => {
    setAccessSession({
      accountId: 1,
      hasPasskey: true,
      hasPassword: true,
      token: "tok",
      username: "ada",
    });
    post.mockResolvedValue({ data: { challenge: "ch", allowCredentials: [] } });
    await expect(fetchLockOptions()).resolves.toEqual({ challenge: "ch", allowCredentials: [] });
    expect(post).toHaveBeenCalledWith("/api/v1/passkeys/lock_options", {
      headers: { Authorization: "Bearer tok" },
    });
  });

  it("throws the API error or a fallback when lock options fail", async () => {
    post.mockResolvedValue({ error: { error: { code: "unauthenticated" } } });
    await expect(fetchLockOptions()).rejects.toEqual({ error: { code: "unauthenticated" } });
    post.mockResolvedValue({ data: undefined });
    await expect(fetchLockOptions()).rejects.toThrow("lock_options_failed");
  });

  it("asserts a lock credential and verifies a password", async () => {
    const credential = {
      id: "id",
      rawId: "raw",
      type: "public-key",
      response: {
        authenticatorData: "ad",
        clientDataJSON: "cd",
        signature: "sig",
        userHandle: null,
      },
    };
    post
      .mockResolvedValueOnce({ data: { ok: true } })
      .mockResolvedValueOnce({ data: { ok: true } });
    await expect(assertLock(credential)).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith("/api/v1/passkeys/assert_lock", {
      headers: {},
      body: { credential },
    });
    await expect(verifyPasswordLock("secret12")).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith("/api/v1/users/me/verify_password", {
      headers: {},
      body: { password: "secret12" },
    });
  });

  it("throws when assert or password verify returns an error", async () => {
    post.mockResolvedValue({ error: { error: { code: "unauthenticated" } } });
    await expect(
      assertLock({
        id: "id",
        rawId: "raw",
        type: "public-key",
        response: {
          authenticatorData: "ad",
          clientDataJSON: "cd",
          signature: "sig",
          userHandle: null,
        },
      }),
    ).rejects.toEqual({ error: { code: "unauthenticated" } });
    await expect(verifyPasswordLock("nope")).rejects.toEqual({
      error: { code: "unauthenticated" },
    });
  });
});
