import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "@/shared/lib/api/client";
import {
  completeOnboarding,
  checkUsername,
  fetchAccount,
  fetchMe,
  setPassword,
  updateProfile,
} from "./identity";
import { createBlock, destroyBlock, listBlocks } from "./blocks";
import { fetchPhoneVerification, issuePhoneVerification } from "./phone";
import { fetchRegistrationOptions, registerPasskey } from "./passkeys";

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();

const me = {
  account: { id: 1, username: "ada", display_name: "Ada", kind: "human" },
  user: {
    id: 1,
    email: "ada@example.com",
    onboarded: false,
    has_password: false,
    has_passkey: false,
    phone_verified: false,
  },
};

describe("identity APIs", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
    del.mockReset();
    vi.spyOn(apiClient, "createApiClient").mockReturnValue({
      GET: get,
      POST: post,
      PATCH: patch,
      DELETE: del,
    } as unknown as ReturnType<typeof apiClient.createApiClient>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads, updates, and completes the current profile", async () => {
    get.mockResolvedValue({ data: me });
    patch.mockResolvedValue({ data: me });
    post.mockResolvedValue({ data: { ...me, user: { ...me.user, onboarded: true } } });
    await expect(fetchMe()).resolves.toEqual(me);
    await expect(updateProfile({ display_name: "Ada", username: "ada" })).resolves.toEqual(me);
    await expect(completeOnboarding()).resolves.toMatchObject({
      user: { onboarded: true },
    });
    get.mockResolvedValue({ data: { available: true } });
    await expect(checkUsername("ada")).resolves.toEqual({ available: true });
    patch.mockResolvedValue({ data: { token: "t", ...me } });
    await expect(setPassword("password12", "password12")).resolves.toMatchObject({ token: "t" });
    get.mockResolvedValue({ data: me.account });
    await expect(fetchAccount(1)).resolves.toEqual({ account: me.account, missing: false });
    get.mockResolvedValue({ data: undefined });
    await expect(fetchAccount(2)).resolves.toEqual({ account: null, missing: true });
    get.mockResolvedValue({ error: { error: { code: "not_found" } } });
    await expect(fetchAccount(3)).resolves.toEqual({ account: null, missing: true });
  });

  it("issues and polls phone verification", async () => {
    post.mockResolvedValue({
      data: { status: "pending", code: "123456", wa_url: "https://wa.me/1", phone_changed: false },
    });
    get.mockResolvedValue({
      data: { status: "confirmed", confirmed_phone: "1555", phone_changed: true },
    });
    await expect(issuePhoneVerification()).resolves.toMatchObject({ status: "pending" });
    await expect(fetchPhoneVerification()).resolves.toMatchObject({ status: "confirmed" });
  });

  it("lists, creates, and destroys blocks", async () => {
    get.mockResolvedValue({ data: { blocks: [] } });
    post.mockResolvedValue({ data: { account: me.account } });
    del.mockResolvedValue({ data: { ok: true } });
    await expect(listBlocks()).resolves.toEqual({ blocks: [] });
    await expect(createBlock(2)).resolves.toEqual({ account: me.account });
    await expect(destroyBlock(2)).resolves.toEqual({ ok: true });
  });

  it("registers a passkey", async () => {
    post
      .mockResolvedValueOnce({ data: { challenge: "YQ" } })
      .mockResolvedValueOnce({ data: { id: 1, nickname: "Passkey", created_at: "t" } });
    await expect(fetchRegistrationOptions()).resolves.toEqual({ challenge: "YQ" });
    await expect(
      registerPasskey("Passkey", {
        id: "id",
        rawId: "raw",
        type: "public-key",
        response: { attestationObject: "ao", clientDataJSON: "cd" },
      }),
    ).resolves.toMatchObject({ id: 1 });
  });
});
