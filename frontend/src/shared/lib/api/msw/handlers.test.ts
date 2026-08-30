import { afterEach, describe, expect, it } from "vitest";
import { createApiClient } from "../client";
import { handlerMap, handlers } from "./handlers";
import { MESSAGE_STAMP, messagingStore, resetMessagingStore } from "./messaging-store";

const expectedPaths = [
  "/api/v1/accounts/username",
  "/api/v1/accounts/{id}",
  "/api/v1/admin/users/{user_id}/verify_phone",
  "/api/v1/blocks",
  "/api/v1/blocks/{id}",
  "/api/v1/contact_nicknames",
  "/api/v1/contact_nicknames/{account_id}",
  "/api/v1/conversation_folders",
  "/api/v1/conversation_folders/reorder",
  "/api/v1/conversation_folders/{conversation_folder_id}/conversations",
  "/api/v1/conversation_folders/{conversation_folder_id}/conversations/{conversation_id}",
  "/api/v1/conversation_folders/{id}",
  "/api/v1/conversations",
  "/api/v1/conversations/{conversation_id}/invites",
  "/api/v1/conversations/{conversation_id}/invites/{id}",
  "/api/v1/conversations/{conversation_id}/join_requests",
  "/api/v1/conversations/{conversation_id}/join_requests/{id}/approve",
  "/api/v1/conversations/{conversation_id}/join_requests/{id}/reject",
  "/api/v1/conversations/{conversation_id}/members",
  "/api/v1/conversations/{conversation_id}/members/{account_id}",
  "/api/v1/conversations/{conversation_id}/members/{account_id}/demote",
  "/api/v1/conversations/{conversation_id}/members/{account_id}/promote",
  "/api/v1/conversations/{conversation_id}/members/{account_id}/transfer",
  "/api/v1/conversations/{conversation_id}/messages",
  "/api/v1/conversations/{conversation_id}/pins",
  "/api/v1/conversations/{conversation_id}/pins/{message_id}",
  "/api/v1/conversations/{id}",
  "/api/v1/conversations/{id}/archive",
  "/api/v1/conversations/{id}/leave",
  "/api/v1/conversations/{id}/mute",
  "/api/v1/conversations/{id}/pin",
  "/api/v1/conversations/{id}/receipts",
  "/api/v1/conversations/{id}/unread",
  "/api/v1/invites/{token}",
  "/api/v1/invites/{token}/join",
  "/api/v1/messages",
  "/api/v1/messages/bulk_forward",
  "/api/v1/messages/bulk_save",
  "/api/v1/messages/bulk_unsend",
  "/api/v1/messages/{id}",
  "/api/v1/messages/{id}/forward",
  "/api/v1/messages/{id}/info",
  "/api/v1/messages/{message_id}/reactions",
  "/api/v1/messages/{message_id}/reactions/{emoji}",
  "/api/v1/message_reminders",
  "/api/v1/message_reminders/{id}",
  "/api/v1/passkeys",
  "/api/v1/passkeys/assert_lock",
  "/api/v1/passkeys/lock_options",
  "/api/v1/passkeys/register",
  "/api/v1/passkeys/registration_options",
  "/api/v1/passkeys/{id}",
  "/api/v1/polls/{id}",
  "/api/v1/polls/{id}/close",
  "/api/v1/polls/{id}/vote",
  "/api/v1/saved_messages",
  "/api/v1/saved_messages/{id}",
  "/api/v1/saved_replies",
  "/api/v1/saved_replies/{id}",
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
    const receipts = await client.POST("/api/v1/conversations/{id}/receipts", {
      headers: { Authorization: "Bearer dev-2" },
      params: { path: { id: 1 } },
      body: { kind: "viewed", position: 1 },
    });
    expect(receipts.data?.id).toBe(1);
    const deliveredReceipts = await client.POST("/api/v1/conversations/{id}/receipts", {
      params: { path: { id: 1 } },
      body: { kind: "delivered" } as { kind: "delivered"; position: number },
    });
    expect(deliveredReceipts.data?.id).toBe(1);
    const missingReceipts = await client.POST("/api/v1/conversations/{id}/receipts", {
      params: { path: { id: 999 } },
      body: { kind: "delivered", position: 1 },
    });
    expect(missingReceipts.response.status).toBe(404);
    const missingConversation = await client.GET("/api/v1/conversations/{id}", {
      params: { path: { id: 999 } },
    });
    expect(missingConversation.response.status).toBe(404);
    const patched = await client.PATCH("/api/v1/conversations/{id}", {
      params: { path: { id: 1 } },
      body: { title: "Notes", description: "notes" },
    });
    expect(patched.data?.id).toBe(1);
    const invalidPatch = await fetch("http://rajya.test/api/v1/conversations/1", {
      method: "PATCH",
      body: "not-json",
    });
    expect(invalidPatch.status).toBe(200);
    const addedMembers = await client.POST("/api/v1/conversations/{conversation_id}/members", {
      params: { path: { conversation_id: 1 } },
      body: { account_ids: [2] },
    });
    expect(addedMembers.data?.id).toBe(1);
    const promoted = await client.PATCH(
      "/api/v1/conversations/{conversation_id}/members/{account_id}/promote",
      { params: { path: { conversation_id: 1, account_id: 2 } } },
    );
    expect(promoted.data?.id).toBe(1);
    const demoted = await client.PATCH(
      "/api/v1/conversations/{conversation_id}/members/{account_id}/demote",
      { params: { path: { conversation_id: 1, account_id: 2 } } },
    );
    expect(demoted.data?.id).toBe(1);
    const transferred = await client.PATCH(
      "/api/v1/conversations/{conversation_id}/members/{account_id}/transfer",
      { params: { path: { conversation_id: 1, account_id: 2 } } },
    );
    expect(transferred.data?.id).toBe(1);
    const removedMember = await client.DELETE(
      "/api/v1/conversations/{conversation_id}/members/{account_id}",
      { params: { path: { conversation_id: 1, account_id: 2 } } },
    );
    expect(removedMember.data?.id).toBe(1);
    const left = await client.POST("/api/v1/conversations/{id}/leave", {
      params: { path: { id: 1 } },
    });
    expect(left.data?.ok).toBe(true);
    const missingMembers = await client.POST("/api/v1/conversations/{conversation_id}/members", {
      params: { path: { conversation_id: 999 } },
      body: { account_ids: [2] },
    });
    expect(missingMembers.response.status).toBe(404);
    const missingPromote = await client.PATCH(
      "/api/v1/conversations/{conversation_id}/members/{account_id}/promote",
      { params: { path: { conversation_id: 999, account_id: 2 } } },
    );
    expect(missingPromote.response.status).toBe(404);
    const missingDemote = await client.PATCH(
      "/api/v1/conversations/{conversation_id}/members/{account_id}/demote",
      { params: { path: { conversation_id: 999, account_id: 2 } } },
    );
    expect(missingDemote.response.status).toBe(404);
    const missingTransfer = await client.PATCH(
      "/api/v1/conversations/{conversation_id}/members/{account_id}/transfer",
      { params: { path: { conversation_id: 999, account_id: 2 } } },
    );
    expect(missingTransfer.response.status).toBe(404);
    const missingRemove = await client.DELETE(
      "/api/v1/conversations/{conversation_id}/members/{account_id}",
      { params: { path: { conversation_id: 999, account_id: 2 } } },
    );
    expect(missingRemove.response.status).toBe(404);
    const missingLeave = await client.POST("/api/v1/conversations/{id}/leave", {
      params: { path: { id: 999 } },
    });
    expect(missingLeave.response.status).toBe(404);
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
    const afterRevision = await client.GET("/api/v1/conversations/{conversation_id}/messages", {
      params: { path: { conversation_id: 1 }, query: { after_revision: 0 } },
    });
    expect(afterRevision.data?.messages.length).toBeGreaterThan(0);
    const missingAround = await client.GET("/api/v1/conversations/{conversation_id}/messages", {
      params: { path: { conversation_id: 1 }, query: { around_id: 0 } },
    });
    expect(missingAround.response.status).toBe(404);
    const sent = await client.POST("/api/v1/messages", {
      body: { conversation_id: 1, body: "hello", client_nonce: "nonce-1" },
    });
    expect(sent.data?.body).toBe("hello");
    expect(sent.data?.silent).toBe(false);
    const silent = await client.POST("/api/v1/messages", {
      body: { conversation_id: 1, body: "quiet", client_nonce: "nonce-silent", silent: true },
    });
    expect(silent.data?.silent).toBe(true);
    const permalink = await client.GET("/api/v1/messages/{id}", {
      params: { path: { id: sent.data?.id ?? 1 } },
    });
    expect(permalink.data?.id).toBe(sent.data?.id);
    const missingPermalink = await client.GET("/api/v1/messages/{id}", {
      params: { path: { id: 0 } },
    });
    expect(missingPermalink.response.status).toBe(404);
    const reactionDetails = await client.GET("/api/v1/messages/{message_id}/reactions", {
      params: { path: { message_id: sent.data?.id ?? 1 } },
    });
    expect(reactionDetails.data?.reactions).toEqual([]);
    const bulkSaved = await client.POST("/api/v1/messages/bulk_save", {
      body: { message_ids: [sent.data?.id ?? 1] },
    });
    expect(bulkSaved.response.status).toBe(201);
    const bulkSavedMissing = await client.POST("/api/v1/messages/bulk_save", {
      body: {},
    });
    expect(bulkSavedMissing.response.status).toBe(201);
    const bulkSavedUnknown = await client.POST("/api/v1/messages/bulk_save", {
      body: { message_ids: [0] },
    });
    expect(bulkSavedUnknown.response.status).toBe(201);
    const bulkForwardedMissing = await client.POST("/api/v1/messages/bulk_forward", {
      body: { conversation_id: 1, message_ids: [0] },
    });
    expect(bulkForwardedMissing.response.status).toBe(201);
    const bulkForwarded = await client.POST("/api/v1/messages/bulk_forward", {
      body: { conversation_id: 1, message_ids: [sent.data?.id ?? 1] },
    });
    expect(bulkForwarded.response.status).toBe(201);
    const bulkForwardEmpty = await client.POST("/api/v1/messages/bulk_forward", {
      body: {},
    });
    expect(bulkForwardEmpty.response.status).toBe(201);
    const bulkForwardNoChat = await client.POST("/api/v1/messages/bulk_forward", {
      body: { message_ids: [sent.data?.id ?? 1] },
    });
    expect(bulkForwardNoChat.response.status).toBe(201);
    const bulkUnsentEmpty = await client.POST("/api/v1/messages/bulk_unsend", {
      body: {},
    });
    expect(bulkUnsentEmpty.data?.messages).toEqual([]);
    const bulkUnsent = await client.POST("/api/v1/messages/bulk_unsend", {
      body: { message_ids: [silent.data?.id ?? 1] },
    });
    expect(bulkUnsent.data?.messages[0]?.deleted).toBe(true);
    const bulkForwardTombstone = await client.POST("/api/v1/messages/bulk_forward", {
      body: { message_ids: [silent.data?.id ?? 1] },
    });
    expect(bulkForwardTombstone.response.status).toBe(201);
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
    const listedReactions = await client.GET("/api/v1/messages/{message_id}/reactions", {
      params: { path: { message_id: sent.data?.id ?? 1 } },
    });
    expect(listedReactions.data?.reactions.length).toBeGreaterThan(0);
    const storedId = sent.data?.id ?? 1;
    for (const rows of Object.values(messagingStore().messages)) {
      const stored = rows.find((row) => row.id === storedId);
      if (stored) {
        stored.sender = undefined;
      }
    }
    const anonymousReactions = await client.GET("/api/v1/messages/{message_id}/reactions", {
      params: { path: { message_id: sent.data?.id ?? 1 } },
    });
    expect(anonymousReactions.data?.reactions[0]?.account.id).toBe(1);
    const missingReactionList = await client.GET("/api/v1/messages/{message_id}/reactions", {
      params: { path: { message_id: 0 } },
    });
    expect(missingReactionList.response.status).toBe(404);
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
      body: {
        conversation_id: 1,
        body: "later",
        scheduled_at: MESSAGE_STAMP,
        recurrence_rule: "FREQ=DAILY",
      },
    });
    expect(booked.response.status).toBe(201);
    expect(booked.data?.recurrence_rule).toBe("FREQ=DAILY");
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
    const pinnedChat = await client.POST("/api/v1/conversations/{id}/pin", {
      params: { path: { id: 1 } },
    });
    expect(pinnedChat.data?.pinned_at).toBe(MESSAGE_STAMP);
    const unpinnedChat = await client.DELETE("/api/v1/conversations/{id}/pin", {
      params: { path: { id: 1 } },
    });
    expect(unpinnedChat.data?.pinned_at).toBeNull();
    const unreadChat = await client.POST("/api/v1/conversations/{id}/unread", {
      params: { path: { id: 1 } },
    });
    expect(unreadChat.data?.manually_unread_at).toBe(MESSAGE_STAMP);
    const readChat = await client.DELETE("/api/v1/conversations/{id}/unread", {
      params: { path: { id: 1 } },
    });
    expect(readChat.data?.manually_unread_at).toBeNull();
    const missingPinChat = await client.POST("/api/v1/conversations/{id}/pin", {
      params: { path: { id: 0 } },
    });
    expect(missingPinChat.response.status).toBe(404);
    const missingUnreadChat = await client.POST("/api/v1/conversations/{id}/unread", {
      params: { path: { id: 0 } },
    });
    expect(missingUnreadChat.response.status).toBe(404);
    const archivedChat = await client.POST("/api/v1/conversations/{id}/archive", {
      params: { path: { id: 1 } },
    });
    expect(archivedChat.data?.archived_at).toBe(MESSAGE_STAMP);
    const archivedList = await client.GET("/api/v1/conversations", {
      params: { query: { archived: true } },
    });
    expect(archivedList.data?.conversations.some((row) => row.id === 1)).toBe(true);
    const inboxList = await client.GET("/api/v1/conversations");
    expect(inboxList.data?.conversations.some((row) => row.id === 1)).toBe(false);
    const unarchivedChat = await client.DELETE("/api/v1/conversations/{id}/archive", {
      params: { path: { id: 1 } },
    });
    expect(unarchivedChat.data?.archived_at).toBeNull();
    const mutedChat = await client.POST("/api/v1/conversations/{id}/mute", {
      params: { path: { id: 1 } },
      body: { duration: 3600 },
    });
    expect(mutedChat.data?.muted_until).toBeTruthy();
    const unmutedChat = await client.DELETE("/api/v1/conversations/{id}/mute", {
      params: { path: { id: 1 } },
    });
    expect(unmutedChat.data?.muted_until).toBeNull();
    const zeroMute = await client.POST("/api/v1/conversations/{id}/mute", {
      params: { path: { id: 1 } },
      body: { duration: 0 },
    });
    expect(zeroMute.data?.muted_until).toBeNull();
    const omittedMute = await client.POST("/api/v1/conversations/{id}/mute", {
      params: { path: { id: 1 } },
      body: {},
    });
    expect(omittedMute.data?.muted_until).toBeNull();
    const missingArchive = await client.POST("/api/v1/conversations/{id}/archive", {
      params: { path: { id: 0 } },
    });
    expect(missingArchive.response.status).toBe(404);
    const missingMute = await client.POST("/api/v1/conversations/{id}/mute", {
      params: { path: { id: 0 } },
      body: { duration: 3600 },
    });
    expect(missingMute.response.status).toBe(404);
    const missingUnmute = await client.DELETE("/api/v1/conversations/{id}/mute", {
      params: { path: { id: 0 } },
    });
    expect(missingUnmute.response.status).toBe(404);
    const missingUnarchive = await client.DELETE("/api/v1/conversations/{id}/archive", {
      params: { path: { id: 0 } },
    });
    expect(missingUnarchive.response.status).toBe(404);
    const folders = await client.GET("/api/v1/conversation_folders");
    expect(folders.data?.folders).toHaveLength(1);
    const createdFolder = await client.POST("/api/v1/conversation_folders", {
      body: { name: "Home" },
    });
    expect(createdFolder.response.status).toBe(201);
    const unnamedFolder = await client.POST("/api/v1/conversation_folders", { body: {} });
    expect(unnamedFolder.data?.name).toBe("Folder");
    const deletedFolder = await client.DELETE("/api/v1/conversation_folders/{id}", {
      params: { path: { id: unnamedFolder.data?.id ?? 3 } },
    });
    expect(deletedFolder.data?.ok).toBe(true);
    const patchedFolder = await client.PATCH("/api/v1/conversation_folders/{id}", {
      params: { path: { id: 1 } },
      body: { name: "Office" },
    });
    expect(patchedFolder.data?.name).toBe("Office");
    const patchedPosition = await client.PATCH("/api/v1/conversation_folders/{id}", {
      params: { path: { id: 1 } },
      body: {},
    });
    expect(patchedPosition.data?.name).toBe("Office");
    const reordered = await client.PATCH("/api/v1/conversation_folders/reorder", {
      body: { ids: [createdFolder.data?.id ?? 2, 1] },
    });
    expect(reordered.data?.folders[0]?.id).toBe(createdFolder.data?.id);
    const skippedReorder = await client.PATCH("/api/v1/conversation_folders/reorder", {
      body: { ids: [1, 0] },
    });
    expect(skippedReorder.data?.folders.every((folder) => folder.id !== 0)).toBe(true);
    const addedToFolder = await client.POST(
      "/api/v1/conversation_folders/{conversation_folder_id}/conversations",
      {
        params: { path: { conversation_folder_id: 1 } },
        body: { conversation_id: 1 },
      },
    );
    expect(addedToFolder.data?.conversation_ids).toContain(1);
    const addedAgain = await client.POST(
      "/api/v1/conversation_folders/{conversation_folder_id}/conversations",
      {
        params: { path: { conversation_folder_id: 1 } },
        body: { conversation_id: 1 },
      },
    );
    expect(addedAgain.data?.conversation_ids.filter((id) => id === 1)).toHaveLength(1);
    const emptyAdd = await client.POST(
      "/api/v1/conversation_folders/{conversation_folder_id}/conversations",
      {
        params: { path: { conversation_folder_id: 1 } },
        body: {},
      },
    );
    expect(emptyAdd.response.status).toBe(200);
    const removedFromFolder = await client.DELETE(
      "/api/v1/conversation_folders/{conversation_folder_id}/conversations/{conversation_id}",
      {
        params: { path: { conversation_folder_id: 1, conversation_id: 1 } },
      },
    );
    expect(removedFromFolder.data?.conversation_ids).not.toContain(1);
    const missingFolder = await client.PATCH("/api/v1/conversation_folders/{id}", {
      params: { path: { id: 0 } },
      body: { name: "Gone" },
    });
    expect(missingFolder.response.status).toBe(404);
    const missingFolderAdd = await client.POST(
      "/api/v1/conversation_folders/{conversation_folder_id}/conversations",
      {
        params: { path: { conversation_folder_id: 0 } },
        body: { conversation_id: 1 },
      },
    );
    expect(missingFolderAdd.response.status).toBe(404);
    const missingFolderRemove = await client.DELETE(
      "/api/v1/conversation_folders/{conversation_folder_id}/conversations/{conversation_id}",
      {
        params: { path: { conversation_folder_id: 0, conversation_id: 1 } },
      },
    );
    expect(missingFolderRemove.response.status).toBe(404);
    const emptyReorder = await client.PATCH("/api/v1/conversation_folders/reorder", { body: {} });
    expect(emptyReorder.data?.folders).toEqual([]);
    const replies = await client.GET("/api/v1/saved_replies");
    expect(replies.data?.saved_replies).toHaveLength(1);
    const createdReply = await client.POST("/api/v1/saved_replies", {
      body: { shortcut: "/omw", body: "On my way" },
    });
    expect(createdReply.response.status).toBe(201);
    const patchedReply = await client.PATCH("/api/v1/saved_replies/{id}", {
      params: { path: { id: 1 } },
      body: { body: "Soon" },
    });
    expect(patchedReply.data?.id).toBe(1);
    const deletedReply = await client.DELETE("/api/v1/saved_replies/{id}", {
      params: { path: { id: 1 } },
    });
    expect(deletedReply.data?.ok).toBe(true);
    const reminders = await client.GET("/api/v1/message_reminders");
    expect(reminders.data?.message_reminders).toHaveLength(1);
    const createdReminder = await client.POST("/api/v1/message_reminders", {
      body: { message_id: 101, remind_at: MESSAGE_STAMP },
    });
    expect(createdReminder.response.status).toBe(201);
    const patchedReminder = await client.PATCH("/api/v1/message_reminders/{id}", {
      params: { path: { id: 1 } },
      body: { note: "Go" },
    });
    expect(patchedReminder.data?.id).toBe(1);
    const cancelledReminder = await client.DELETE("/api/v1/message_reminders/{id}", {
      params: { path: { id: 1 } },
    });
    expect(cancelledReminder.data?.ok).toBe(true);
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
    const { attachPoll, findMessage } = await import("./messaging-store");
    attachPoll(101, {
      id: 7,
      question: "Q",
      allows_multiple: false,
      is_anonymous: false,
      voter_count: 0,
      closed: false,
      options: [{ id: 1, label: "A", position: 0, vote_count: 0, selected: false }],
    });
    expect(findMessage(101)?.poll?.id).toBe(7);
    const voted = await client.POST("/api/v1/polls/{id}/vote", {
      params: { path: { id: 7 } },
      body: { option_ids: [1] },
    });
    expect(voted.data?.poll?.options[0]?.selected).toBe(true);
    const closed = await client.POST("/api/v1/polls/{id}/close", { params: { path: { id: 7 } } });
    expect(closed.data?.poll?.closed).toBe(true);
    const pollShown = await client.GET("/api/v1/polls/{id}", { params: { path: { id: 7 } } });
    expect(pollShown.data?.question).toBe("Q");
    const missingVote = await client.POST("/api/v1/polls/{id}/vote", {
      params: { path: { id: 0 } },
      body: {},
    });
    expect(missingVote.response.status).toBe(404);
    const missingClose = await client.POST("/api/v1/polls/{id}/close", {
      params: { path: { id: 0 } },
    });
    expect(missingClose.response.status).toBe(404);
    const missingPoll = await client.GET("/api/v1/polls/{id}", { params: { path: { id: 0 } } });
    expect(missingPoll.response.status).toBe(404);
    const listedInvites = await client.GET("/api/v1/conversations/{conversation_id}/invites", {
      params: { path: { conversation_id: 2 } },
    });
    expect(listedInvites.data?.invites).toHaveLength(2);
    const createdInvite = await client.POST("/api/v1/conversations/{conversation_id}/invites", {
      params: { path: { conversation_id: 2 } },
      body: {},
    });
    expect(createdInvite.response.status).toBe(201);
    const limitedInvite = await client.POST("/api/v1/conversations/{conversation_id}/invites", {
      params: { path: { conversation_id: 2 } },
      body: { requires_approval: true, max_uses: 3 },
    });
    expect(limitedInvite.data?.requires_approval).toBe(true);
    const revokedInvite = await client.DELETE(
      "/api/v1/conversations/{conversation_id}/invites/{id}",
      {
        params: { path: { conversation_id: 2, id: limitedInvite.data?.id ?? 0 } },
      },
    );
    expect(revokedInvite.data?.ok).toBe(true);
    const preview = await client.GET("/api/v1/invites/{token}", {
      params: { path: { token: "open" } },
    });
    expect(preview.data?.member_count).toBe(3);
    const missingPreview = await client.GET("/api/v1/invites/{token}", {
      params: { path: { token: "gone" } },
    });
    expect(missingPreview.response.status).toBe(404);
    const joined = await client.POST("/api/v1/invites/{token}/join", {
      params: { path: { token: "open" } },
    });
    expect(joined.data?.status).toBe("joined");
    const pendingJoin = await client.POST("/api/v1/invites/{token}/join", {
      params: { path: { token: "approval" } },
    });
    expect(pendingJoin.data?.status).toBe("pending_approval");
    const failedJoin = await client.POST("/api/v1/invites/{token}/join", {
      params: { path: { token: "fail" } },
    });
    expect(failedJoin.response.status).toBe(409);
    const missingJoin = await client.POST("/api/v1/invites/{token}/join", {
      params: { path: { token: "gone" } },
    });
    expect(missingJoin.response.status).toBe(404);
    const bareJoin = await client.POST("/api/v1/invites/{token}/join", {
      params: { path: { token: "bare" } },
    });
    expect(bareJoin.data?.status).toBe("joined");
    const memberBareJoin = await client.POST("/api/v1/invites/{token}/join", {
      params: { path: { token: "member-bare" } },
    });
    expect(memberBareJoin.data?.status).toBe("already_member");
    const channelPreview = await client.GET("/api/v1/invites/{token}", {
      params: { path: { token: "channel" } },
    });
    expect(channelPreview.data?.kind).toBe("channel");
    const requests = await client.GET("/api/v1/conversations/{conversation_id}/join_requests", {
      params: { path: { conversation_id: 2 } },
    });
    expect(requests.data?.join_requests).toHaveLength(1);
    const approved = await client.POST(
      "/api/v1/conversations/{conversation_id}/join_requests/{id}/approve",
      { params: { path: { conversation_id: 2, id: 1 } } },
    );
    expect(approved.data?.id).toBe(2);
    const missingApprove = await client.POST(
      "/api/v1/conversations/{conversation_id}/join_requests/{id}/approve",
      { params: { path: { conversation_id: 999, id: 1 } } },
    );
    expect(missingApprove.response.status).toBe(404);
    const rejected = await client.POST(
      "/api/v1/conversations/{conversation_id}/join_requests/{id}/reject",
      { params: { path: { conversation_id: 2, id: 1 } } },
    );
    expect(rejected.data?.ok).toBe(true);
  });
});
