import { afterEach, describe, expect, it } from "vitest";
import { createApiClient } from "../client";
import { handlerMap, handlers } from "./handlers";
import { MESSAGE_STAMP, resetMessagingStore } from "./messaging-store";

const expectedPaths = [
  "/api/v1/accounts/username",
  "/api/v1/accounts/{id}",
  "/api/v1/admin/users/{user_id}/verify_phone",
  "/api/v1/blocks",
  "/api/v1/blocks/{id}",
  "/api/v1/contact_nicknames",
  "/api/v1/contact_nicknames/{account_id}",
  "/api/v1/conversations",
  "/api/v1/conversations/{conversation_id}/messages",
  "/api/v1/conversations/{conversation_id}/pins",
  "/api/v1/conversations/{conversation_id}/pins/{message_id}",
  "/api/v1/conversations/{id}",
  "/api/v1/messages",
  "/api/v1/messages/{id}",
  "/api/v1/messages/{id}/forward",
  "/api/v1/messages/{id}/info",
  "/api/v1/messages/{message_id}/reactions",
  "/api/v1/messages/{message_id}/reactions/{emoji}",
  "/api/v1/passkeys",
  "/api/v1/passkeys/assert_lock",
  "/api/v1/passkeys/lock_options",
  "/api/v1/passkeys/register",
  "/api/v1/passkeys/registration_options",
  "/api/v1/passkeys/{id}",
  "/api/v1/saved_messages",
  "/api/v1/saved_messages/{id}",
  "/api/v1/scheduled_messages",
  "/api/v1/scheduled_messages/{id}",
  "/api/v1/scheduled_messages/{id}/send_now",
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
  afterEach(() => resetMessagingStore());

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
    const revokedOne = await client.DELETE("/api/v1/sessions/{id}", {
      params: { path: { id: 1 } },
    });
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

  it("serves conversation and message routes from the in-memory store", async () => {
    const client = createApiClient("http://rajya.test");
    const listed = await client.GET("/api/v1/conversations");
    expect(listed.data?.conversations.length).toBeGreaterThan(0);
    const created = await client.POST("/api/v1/conversations", { body: { kind: "group" } });
    expect(created.data?.id).toBe(1);
    const shown = await client.GET("/api/v1/conversations/{id}", { params: { path: { id: 1 } } });
    expect(shown.data?.id).toBe(1);
    const missingConversation = await client.GET("/api/v1/conversations/{id}", {
      params: { path: { id: 999 } },
    });
    expect(missingConversation.response.status).toBe(404);
    const patched = await client.PATCH("/api/v1/conversations/{id}", {
      params: { path: { id: 1 } },
      body: { description: "notes" },
    });
    expect(patched.data?.id).toBe(1);
    const page = await client.GET("/api/v1/conversations/{conversation_id}/messages", {
      params: { path: { conversation_id: 1 } },
    });
    expect(page.data?.messages.length).toBeGreaterThan(0);
    const firstId = page.data?.messages[0]?.id ?? 0;
    const around = await client.GET("/api/v1/conversations/{conversation_id}/messages", {
      params: { path: { conversation_id: 1 }, query: { around_id: firstId } },
    });
    expect(around.data?.meta.pivot_id).toBe(firstId);
    const aroundAt = await client.GET("/api/v1/conversations/{conversation_id}/messages", {
      params: { path: { conversation_id: 1 }, query: { around_at: MESSAGE_STAMP } },
    });
    expect(aroundAt.data?.messages.length).toBeGreaterThan(0);
    const after = await client.GET("/api/v1/conversations/{conversation_id}/messages", {
      params: { path: { conversation_id: 1 }, query: { after: 0 } },
    });
    expect(after.data?.messages.length).toBeGreaterThan(0);
    const before = await client.GET("/api/v1/conversations/{conversation_id}/messages", {
      params: { path: { conversation_id: 1 }, query: { before: 99 } },
    });
    expect(before.data?.messages.length).toBeGreaterThan(0);
    const missingAround = await client.GET("/api/v1/conversations/{conversation_id}/messages", {
      params: { path: { conversation_id: 1 }, query: { around_id: 0 } },
    });
    expect(missingAround.response.status).toBe(404);
    const sent = await client.POST("/api/v1/messages", {
      body: { conversation_id: 1, body: "hello", client_nonce: "nonce-1" },
    });
    expect(sent.data?.body).toBe("hello");
    const forwarded = await client.POST("/api/v1/messages/{id}/forward", {
      params: { path: { id: sent.data?.id ?? 1 } },
      body: { conversation_id: 1 },
    });
    expect(forwarded.response.status).toBe(201);
    const edited = await client.PATCH("/api/v1/messages/{id}", {
      params: { path: { id: sent.data?.id ?? 1 } },
      body: { body: "edited" },
    });
    expect(edited.data?.body).toBe("edited");
    const info = await client.GET("/api/v1/messages/{id}/info", {
      params: { path: { id: sent.data?.id ?? 1 } },
    });
    expect(info.data?.delivered.length).toBeGreaterThan(0);
    const missingInfo = await client.GET("/api/v1/messages/{id}/info", {
      params: { path: { id: 0 } },
    });
    expect(missingInfo.response.status).toBe(404);
    const reacted = await client.POST("/api/v1/messages/{message_id}/reactions", {
      params: { path: { message_id: sent.data?.id ?? 1 } },
      body: { emoji: "👍" },
    });
    expect(reacted.response.status).toBe(201);
    const unreacted = await client.DELETE("/api/v1/messages/{message_id}/reactions/{emoji}", {
      params: { path: { message_id: sent.data?.id ?? 1, emoji: "👍" } },
    });
    expect(unreacted.data?.id).toBe(sent.data?.id);
    const pinned = await client.POST("/api/v1/conversations/{conversation_id}/pins", {
      params: { path: { conversation_id: 1 } },
      body: { message_id: sent.data?.id ?? 1 },
    });
    expect(pinned.response.status).toBe(201);
    const unpinned = await client.DELETE(
      "/api/v1/conversations/{conversation_id}/pins/{message_id}",
      { params: { path: { conversation_id: 1, message_id: sent.data?.id ?? 1 } } },
    );
    expect(unpinned.data?.ok).toBe(true);
    const saved = await client.POST("/api/v1/saved_messages", {
      body: { message_id: sent.data?.id ?? 1 },
    });
    expect(saved.response.status).toBe(201);
    const unsaved = await client.DELETE("/api/v1/saved_messages/{id}", {
      params: { path: { id: sent.data?.id ?? 1 } },
    });
    expect(unsaved.data?.ok).toBe(true);
    const tombstone = await client.DELETE("/api/v1/messages/{id}", {
      params: { path: { id: sent.data?.id ?? 1 } },
    });
    expect(tombstone.data?.deleted).toBe(true);
    const missingEdit = await client.PATCH("/api/v1/messages/{id}", {
      params: { path: { id: 0 } },
      body: { body: "nope" },
    });
    expect(missingEdit.response.status).toBe(404);
    const missingUnsend = await client.DELETE("/api/v1/messages/{id}", {
      params: { path: { id: 0 } },
    });
    expect(missingUnsend.response.status).toBe(404);
    const missingReact = await client.POST("/api/v1/messages/{message_id}/reactions", {
      params: { path: { message_id: 0 } },
      body: { emoji: "👍" },
    });
    expect(missingReact.response.status).toBe(404);
    const missingUnreact = await client.DELETE("/api/v1/messages/{message_id}/reactions/{emoji}", {
      params: { path: { message_id: 0, emoji: "👍" } },
    });
    expect(missingUnreact.response.status).toBe(404);
    const missingPin = await client.POST("/api/v1/conversations/{conversation_id}/pins", {
      params: { path: { conversation_id: 1 } },
      body: { message_id: 0 },
    });
    expect(missingPin.response.status).toBe(404);
    const missingSave = await client.POST("/api/v1/saved_messages", { body: { message_id: 0 } });
    expect(missingSave.response.status).toBe(404);
    const scheduled = await client.GET("/api/v1/scheduled_messages");
    expect(scheduled.data?.scheduled_messages).toHaveLength(1);
    const booked = await client.POST("/api/v1/scheduled_messages", {
      body: { conversation_id: 1, body: "later", scheduled_at: MESSAGE_STAMP },
    });
    expect(booked.response.status).toBe(201);
    const updated = await client.PATCH("/api/v1/scheduled_messages/{id}", {
      params: { path: { id: 1 } },
      body: { body: "soon" },
    });
    expect(updated.data?.id).toBe(1);
    const sentNow = await client.POST("/api/v1/scheduled_messages/{id}/send_now", {
      params: { path: { id: 1 } },
    });
    expect(sentNow.response.status).toBe(201);
    const cancelled = await client.DELETE("/api/v1/scheduled_messages/{id}", {
      params: { path: { id: 1 } },
    });
    expect(cancelled.data?.ok).toBe(true);
    const forwardedMissing = await client.POST("/api/v1/messages/{id}/forward", {
      params: { path: { id: 0 } },
      body: {},
    });
    expect(forwardedMissing.response.status).toBe(201);
    const patchedEmpty = await client.PATCH("/api/v1/messages/{id}", {
      params: { path: { id: 102 } },
      body: {},
    });
    expect(patchedEmpty.data?.body).toBe("");
    const pinEmpty = await client.POST("/api/v1/conversations/{conversation_id}/pins", {
      params: { path: { conversation_id: 1 } },
      body: {},
    });
    expect(pinEmpty.response.status).toBe(404);
    const saveEmpty = await client.POST("/api/v1/saved_messages", { body: {} });
    expect(saveEmpty.response.status).toBe(404);
    const sentBare = await client.POST("/api/v1/messages", { body: {} });
    expect(sentBare.response.status).toBe(201);
  });
});
