import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApiClient } from "../client";
import { handlerMap, handlers } from "./handlers";

const server = setupServer(...handlers);

const expectedPaths = [
  "/api/v1/accounts/username",
  "/api/v1/accounts/{id}",
  "/api/v1/admin/users/{user_id}/verify_phone",
  "/api/v1/blocks",
  "/api/v1/blocks/{id}",
  "/api/v1/contact_nicknames",
  "/api/v1/contact_nicknames/{account_id}",
  "/api/v1/passkeys",
  "/api/v1/passkeys/assert_lock",
  "/api/v1/passkeys/lock_options",
  "/api/v1/passkeys/register",
  "/api/v1/passkeys/registration_options",
  "/api/v1/passkeys/{id}",
  "/api/v1/sessions",
  "/api/v1/sessions/others",
  "/api/v1/sessions/{id}",
  "/api/v1/users/me",
  "/api/v1/users/me/complete_onboarding",
  "/api/v1/users/me/email",
  "/api/v1/users/me/email/change",
  "/api/v1/users/me/email/verify",
  "/api/v1/users/me/google",
  "/api/v1/users/me/password",
  "/api/v1/users/me/phone/verification",
  "/api/v1/users/me/verify_password",
  "/auth/forgot_password",
  "/auth/google",
  "/auth/login",
  "/auth/magic_link/request",
  "/auth/magic_link/verify",
  "/auth/otp/request",
  "/auth/otp/verify",
  "/auth/passkeys/authenticate",
  "/auth/passkeys/authentication_options",
  "/auth/register",
  "/auth/reset_password",
  "/health",
  "/up",
  "/webhooks/whatsapp",
];

describe("MSW handlers", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("serves every generated path with typed bodies", async () => {
    expect(Object.keys(handlerMap).sort()).toEqual(expectedPaths.sort());
    expect(handlers).toHaveLength(Object.keys(handlerMap).length);
    const client = createApiClient("http://rajya.test");
    const health = await client.GET("/health");
    expect(health.data?.status).toBe("ok");
    const up = await fetch("http://rajya.test/up");
    expect(up.status).toBe(200);
    const login = await client.POST("/auth/login", {
      body: { email: "ada@example.com", password: "password12" },
    });
    expect(login.data?.token).toBe("test-token");
    expect(login.data?.user.has_password).toBe(true);
    const google = await client.POST("/auth/google", { body: { code: "gis" } });
    expect(google.data?.token).toBe("test-token");
    const register = await client.POST("/auth/register", {
      body: {
        email: "ada@example.com",
        name: "Ada",
        password: "password12",
        password_confirmation: "password12",
      },
    });
    expect(register.data?.token).toBe("test-token");
    const reset = await client.POST("/auth/reset_password", {
      body: { token: "tok", password: "password12", password_confirmation: "password12" },
    });
    expect(reset.data?.token).toBe("test-token");
    const otpVerify = await client.POST("/auth/otp/verify", {
      body: { email: "ada@example.com", code: "000000" },
    });
    expect(otpVerify.data?.token).toBe("test-token");
    const magicVerify = await client.POST("/auth/magic_link/verify", { body: { token: "tok" } });
    expect(magicVerify.data?.token).toBe("test-token");
    const otp = await client.POST("/auth/otp/request", { body: { email: "ada@example.com" } });
    expect(otp.data?.accepted).toBe(true);
    const magic = await client.POST("/auth/magic_link/request", {
      body: { email: "ada@example.com" },
    });
    expect(magic.data?.accepted).toBe(true);
    const forgot = await client.POST("/auth/forgot_password", {
      body: { email: "ada@example.com" },
    });
    expect(forgot.data?.accepted).toBe(true);
    const passkeyOptions = await client.POST("/auth/passkeys/authentication_options", {
      body: { email: "ada@example.com" },
    });
    expect(passkeyOptions.data?.challenge).toBe("YQ");
    const passkeyAuth = await client.POST("/auth/passkeys/authenticate", {
      body: { nonce: "nonce", credential: {} },
    });
    expect(passkeyAuth.data?.token).toBe("test-token");
    const listed = await client.GET("/api/v1/passkeys");
    expect(listed.data?.passkeys).toHaveLength(1);
    const registration = await client.POST("/api/v1/passkeys/registration_options");
    expect(registration.data?.nonce).toBe("nonce");
    const created = await client.POST("/api/v1/passkeys/register", {
      body: { nickname: "Key", credential: {} },
    });
    expect(created.data?.id).toBe(1);
    const renamed = await client.PATCH("/api/v1/passkeys/{id}", {
      params: { path: { id: "1" } },
      body: { nickname: "Laptop" },
    });
    expect(renamed.data?.nickname).toBe("Key");
    const removed = await client.DELETE("/api/v1/passkeys/{id}", {
      params: { path: { id: "1" } },
    });
    expect(removed.data?.ok).toBe(true);
    const lockOptions = await client.POST("/api/v1/passkeys/lock_options");
    expect(lockOptions.data?.challenge).toBe("YQ");
    const asserted = await client.POST("/api/v1/passkeys/assert_lock", {
      body: { credential: {} },
    });
    expect(asserted.data?.ok).toBe(true);
    const passwordSet = await client.PATCH("/api/v1/users/me/password", {
      body: { password: "password12", password_confirmation: "password12" },
    });
    expect(passwordSet.data?.token).toBe("test-token");
    const passwordRemoved = await client.DELETE("/api/v1/users/me/password");
    expect(passwordRemoved.data?.ok).toBe(true);
    const verified = await client.POST("/api/v1/users/me/verify_password", {
      body: { password: "password12" },
    });
    expect(verified.data?.ok).toBe(true);
    const emailRemoved = await client.DELETE("/api/v1/users/me/email");
    expect(emailRemoved.data?.ok).toBe(true);
    const googleRemoved = await client.DELETE("/api/v1/users/me/google");
    expect(googleRemoved.data?.ok).toBe(true);
    const me = await client.GET("/api/v1/users/me");
    expect(me.data?.user.phone_verified).toBe(false);
    const patched = await client.PATCH("/api/v1/users/me", { body: { display_name: "Ada" } });
    expect(patched.data?.account.username).toBe("ada");
    const deactivated = await client.DELETE("/api/v1/users/me");
    expect(deactivated.data?.ok).toBe(true);
    const onboarded = await client.POST("/api/v1/users/me/complete_onboarding");
    expect(onboarded.data?.user.onboarded).toBe(false);
    const emailChange = await client.POST("/api/v1/users/me/email/change", {
      body: { email: "new@example.com" },
    });
    expect(emailChange.data?.accepted).toBe(true);
    const emailVerify = await client.POST("/api/v1/users/me/email/verify", {
      body: { code: "000000" },
    });
    expect(emailVerify.data?.account.id).toBe(1);
    const phoneIssue = await client.POST("/api/v1/users/me/phone/verification");
    expect(phoneIssue.data?.status).toBe("none");
    const phoneStatus = await client.GET("/api/v1/users/me/phone/verification");
    expect(phoneStatus.data?.phone_changed).toBe(false);
    const username = await client.GET("/api/v1/accounts/username", {
      params: { query: { username: "ada" } },
    });
    expect(username.data?.available).toBe(true);
    const profile = await client.GET("/api/v1/accounts/{id}", { params: { path: { id: 1 } } });
    expect(profile.data?.id).toBe(1);
    const blocks = await client.GET("/api/v1/blocks");
    expect(blocks.data?.blocks).toEqual([]);
    const blocked = await client.POST("/api/v1/blocks", { body: { account_id: 2 } });
    expect(blocked.data?.account.id).toBe(1);
    const unblocked = await client.DELETE("/api/v1/blocks/{id}", { params: { path: { id: 2 } } });
    expect(unblocked.data?.ok).toBe(true);
    const sessions = await client.GET("/api/v1/sessions");
    expect(sessions.data?.sessions[0]?.current).toBe(true);
    const revokedOther = await client.DELETE("/api/v1/sessions/others");
    expect(revokedOther.data?.ok).toBe(true);
    const revokedOne = await client.DELETE("/api/v1/sessions/{id}", { params: { path: { id: 1 } } });
    expect(revokedOne.data?.ok).toBe(true);
    const nicknames = await client.GET("/api/v1/contact_nicknames");
    expect(nicknames.data?.nicknames[0]?.nickname).toBe("Ada");
    const nicknamed = await client.PUT("/api/v1/contact_nicknames/{account_id}", {
      params: { path: { account_id: 2 } },
      body: { nickname: "Ada" },
    });
    expect(nicknamed.data?.nickname).toBe("Ada");
    const unnamed = await client.DELETE("/api/v1/contact_nicknames/{account_id}", {
      params: { path: { account_id: 2 } },
    });
    expect(unnamed.data?.ok).toBe(true);
    const adminPhone = await client.POST("/api/v1/admin/users/{user_id}/verify_phone", {
      params: { path: { user_id: 1 } },
      body: { phone: "1555" },
    });
    expect(adminPhone.data?.user.phone_verified).toBe(false);
    const webhook = await fetch("http://rajya.test/webhooks/whatsapp?hub.mode=subscribe");
    expect(webhook.status).toBe(200);
    const inbound = await client.POST("/webhooks/whatsapp", {
      body: { object: "whatsapp_business_account" },
    });
    expect(inbound.data?.ok).toBe(true);
  });
});
