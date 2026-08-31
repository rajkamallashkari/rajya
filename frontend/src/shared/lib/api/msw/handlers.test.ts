import { afterEach, describe, expect, it } from "vitest";
import { createApiClient } from "../client";
import { actorLabel, handlerMap, handlers, resetAiHelpers, resetFiledReports, resetPreferences } from "./handlers";
import {
  MESSAGE_STAMP,
  messagingStore,
  resetMessagingStore,
  messageSearchHits,
  conversationSearchHits,
  accountSearchHits,
} from "./messaging-store";

const expectedPaths = [
  "/api/v1/accounts/search",
  "/api/v1/accounts/username",
  "/api/v1/accounts/{id}",
  "/api/v1/accent_configs",
  "/api/v1/admin/bot_requests",
  "/api/v1/admin/bot_requests/{id}/approve",
  "/api/v1/admin/bot_requests/{id}/decline",
  "/api/v1/admin/users/{user_id}/verify_phone",
  "/api/v1/ai/rewrite",
  "/api/v1/ai/translate_text",
  "/api/v1/attachments/{id}/download",
  "/api/v1/attachments/{id}/retry",
  "/api/v1/attachments/{id}/thumbnail",
  "/api/v1/attachments/{id}/transcribe",
  "/api/v1/blocks",
  "/api/v1/blocks/{id}",
  "/api/v1/bot_requests",
  "/api/v1/bot_requests/{id}",
  "/api/v1/bots",
  "/api/v1/bots/{id}",
  "/api/v1/calls",
  "/api/v1/calls/active",
  "/api/v1/calls/ice_servers",
  "/api/v1/calls/{id}",
  "/api/v1/calls/{id}/accept",
  "/api/v1/calls/{id}/cancel",
  "/api/v1/calls/{id}/decline",
  "/api/v1/calls/{id}/hangup",
  "/api/v1/calls/{id}/screen_share",
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
  "/api/v1/conversations/{id}/commands",
  "/api/v1/conversations/{id}/generations/cancel",
  "/api/v1/conversations/{id}/leave",
  "/api/v1/conversations/{id}/media",
  "/api/v1/conversations/{id}/mute",
  "/api/v1/conversations/{id}/pin",
  "/api/v1/conversations/{id}/receipts",
  "/api/v1/conversations/{id}/search",
  "/api/v1/conversations/{id}/suggest_replies",
  "/api/v1/conversations/{id}/summarize",
  "/api/v1/conversations/{id}/unread",
  "/api/v1/conversations/{id}/wallpaper",
  "/api/v1/direct_uploads",
  "/api/v1/export_jobs",
  "/api/v1/export_jobs/{id}",
  "/api/v1/export_jobs/{id}/download",
  "/api/v1/font_configs",
  "/api/v1/gifs",
  "/api/v1/invites/{token}",
  "/api/v1/invites/{token}/join",
  "/api/v1/messages",
  "/api/v1/messages/bulk_forward",
  "/api/v1/messages/bulk_save",
  "/api/v1/messages/bulk_unsend",
  "/api/v1/messages/{id}",
  "/api/v1/messages/{id}/forward",
  "/api/v1/messages/{id}/info",
  "/api/v1/messages/{id}/regenerate",
  "/api/v1/messages/{id}/translate",
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
  "/api/v1/preferences",
  "/api/v1/polls/{id}",
  "/api/v1/polls/{id}/close",
  "/api/v1/polls/{id}/vote",
  "/api/v1/push_subscriptions",
  "/api/v1/push_subscriptions/vapid",
  "/api/v1/reports",
  "/api/v1/reports/reasons",
  "/api/v1/saved_messages",
  "/api/v1/saved_messages/{id}",
  "/api/v1/saved_replies",
  "/api/v1/saved_replies/{id}",
  "/api/v1/scheduled_messages",
  "/api/v1/scheduled_messages/{id}",
  "/api/v1/scheduled_messages/{id}/send_now",
  "/api/v1/search",
  "/api/v1/sessions",
  "/api/v1/sessions/others",
  "/api/v1/sessions/{id}",
  "/api/v1/sticker_packs",
  "/api/v1/sticker_packs/{id}",
  "/api/v1/sticker_packs/{sticker_pack_id}/stickers",
  "/api/v1/sticker_packs/{sticker_pack_id}/stickers/{id}",
  "/api/v1/style_profile",
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
  afterEach(() => {
    resetMessagingStore();
    resetFiledReports();
    resetAiHelpers();
    resetPreferences();
  });

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
    const reportReasons = await client.GET("/api/v1/reports/reasons");
    expect(reportReasons.data?.reasons[0]?.id).toBe("spam");
    const filed = await client.POST("/api/v1/reports", {
      body: { subject_type: "account", subject_id: 2, reason: "spam" },
    });
    expect(filed.response.status).toBe(201);
    const duplicate = await client.POST("/api/v1/reports", {
      body: { subject_type: "account", subject_id: 2, reason: "spam" },
    });
    expect(duplicate.response.status).toBe(409);
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

  it("serves bot directory, rewrite, helpers, and style-profile consent", async () => {
    const client = createApiClient("http://rajya.test");
    const bots = await client.GET("/api/v1/bots");
    expect(bots.data?.bots[0]?.account.kind).toBe("bot");
    const shown = await client.GET("/api/v1/bots/{id}", { params: { path: { id: 1 } } });
    expect(shown.data?.account.username).toBe("nimbus");
    const missingBot = await client.GET("/api/v1/bots/{id}", { params: { path: { id: 9 } } });
    expect(missingBot.response.status).toBe(404);
    const requests = await client.GET("/api/v1/bot_requests");
    expect(requests.data?.bot_requests).toEqual([]);
    const proposed = await client.POST("/api/v1/bot_requests", {
      body: {
        kind: "create",
        payload: { bio: "Sky", name: "Nimbus", persona_prompt: "A".repeat(80), username: "nimbus" },
      },
    });
    expect(proposed.data?.status).toBe("pending");
    const withdrawn = await client.DELETE("/api/v1/bot_requests/{id}", {
      params: { path: { id: 1 } },
    });
    expect(withdrawn.data?.ok).toBe(true);
    const adminListed = await client.GET("/api/v1/admin/bot_requests");
    expect(adminListed.data?.bot_requests).toEqual([]);
    const approved = await client.POST("/api/v1/admin/bot_requests/{id}/approve", {
      params: { path: { id: 1 } },
    });
    expect(approved.data?.account.username).toBe("nimbus");
    const declined = await client.POST("/api/v1/admin/bot_requests/{id}/decline", {
      params: { path: { id: 1 } },
      body: { reason: "Too thin" },
    });
    expect(declined.data?.status).toBe("declined");
    const rewrite = await client.POST("/api/v1/ai/rewrite", {
      body: { instruction: "Rewrite this draft", text: "hey" },
    });
    expect(rewrite.data?.text).toBe("Hello");
    const translated = await client.POST("/api/v1/messages/{id}/translate", {
      params: { path: { id: 1 } },
      body: { target_language: "en" },
    });
    expect(translated.data?.text).toBe("Hello");
    const text = await client.POST("/api/v1/ai/translate_text", {
      body: { target_language: "en", text: "Hola" },
    });
    expect(text.data?.text).toBe("Hello");
    const chips = await client.POST("/api/v1/conversations/{id}/suggest_replies", {
      params: { path: { id: 1 } },
      body: { message_id: 1 },
    });
    expect(chips.data?.suggestions).toEqual(["On my way"]);
    const summary = await client.POST("/api/v1/conversations/{id}/summarize", {
      params: { path: { id: 1 } },
      body: { mode: "unread" },
    });
    expect(summary.data?.text).toBe("Ship Friday");
    const prefs = await client.GET("/api/v1/preferences");
    expect((prefs.data?.data.appearance as { theme: string }).theme).toBe("system");
    const patchedPrefs = await client.PATCH("/api/v1/preferences", {
      body: { data: { appearance: { theme: "dark" } } },
    });
    expect((patchedPrefs.data?.data.appearance as { theme: string }).theme).toBe("dark");
    const blankPrefs = await client.PATCH("/api/v1/preferences", {
      body: {} as { data: { [key: string]: unknown } },
    });
    expect(blankPrefs.response.status).toBe(200);
    const fonts = await client.GET("/api/v1/font_configs");
    expect(fonts.data?.font_configs[0]?.name).toBe("System");
    const accents = await client.GET("/api/v1/accent_configs");
    expect(accents.data?.accent_configs[0]?.id).toBe("cyber_indigo");
    const paper = await client.PATCH("/api/v1/conversations/{id}/wallpaper", {
      params: { path: { id: 1 } },
      body: { wallpaper: { preset: "dusk", dim: 0.1, blur: 0 } },
    });
    expect(paper.data?.wallpaper?.preset).toBe("dusk");
    const missingPaper = await client.PATCH("/api/v1/conversations/{id}/wallpaper", {
      params: { path: { id: 999 } },
      body: { wallpaper: { preset: "mist", dim: 0, blur: 0 } },
    });
    expect(missingPaper.response.status).toBe(404);
    const style = await client.GET("/api/v1/style_profile");
    expect(style.data?.enabled).toBe(false);
    const refused = await client.POST("/api/v1/style_profile");
    expect(refused.response.status).toBe(403);
    const opted = await client.PATCH("/api/v1/style_profile", { body: { enabled: true } });
    expect(opted.data?.enabled).toBe(true);
    const built = await client.POST("/api/v1/style_profile");
    expect(built.data?.profile).toContain("Casual");
  });

  it("serves the call lifecycle routes", async () => {
    expect(actorLabel(1)).toEqual({ name: "Ada", username: "ada" });
    expect(actorLabel(2)).toEqual({ name: "Grace", username: "grace" });
    expect(actorLabel(9)).toEqual({ name: "user9", username: "user9" });
    const client = createApiClient("http://rajya.test");
    const started = await client.POST("/api/v1/calls", {
      body: { kind: "video" } as never,
    });
    expect(started.response.status).toBe(201);
    expect(started.data?.call?.kind).toBe("video");
    expect(started.data?.call?.status).toBe("ringing");
    expect(started.data?.call?.ended_at).toBeNull();
    const audio = await client.POST("/api/v1/calls", {
      headers: { Authorization: "Bearer dev-2" },
      body: { conversation_id: 1 },
    });
    expect(audio.data?.call?.kind).toBe("audio");
    const active = await client.GET("/api/v1/calls/active");
    expect(active.data?.call).toBeUndefined();
    const ice = await client.GET("/api/v1/calls/ice_servers");
    expect(ice.data?.ice_servers).toHaveLength(1);
    const shown = await client.GET("/api/v1/calls/{id}", { params: { path: { id: 7 } } });
    expect(shown.data?.call?.id).toBe(7);
    expect(shown.data?.call?.participants[1]?.status).toBe("joined");
    const accepted = await client.POST("/api/v1/calls/{id}/accept", {
      params: { path: { id: 7 } },
    });
    expect(accepted.data?.call?.status).toBe("active");
    const cancelled = await client.POST("/api/v1/calls/{id}/cancel", {
      params: { path: { id: 7 } },
    });
    expect(cancelled.data?.call?.status).toBe("missed");
    expect(cancelled.data?.call?.ended_at).toBe(MESSAGE_STAMP);
    const declined = await client.POST("/api/v1/calls/{id}/decline", {
      params: { path: { id: 7 } },
    });
    expect(declined.data?.call?.status).toBe("declined");
    const ended = await client.POST("/api/v1/calls/{id}/hangup", { params: { path: { id: 7 } } });
    expect(ended.data?.call?.status).toBe("ended");
    expect(started.data?.call?.participants[0]?.is_screen_sharing).toBe(false);
    const shared = await client.POST("/api/v1/calls/{id}/screen_share", {
      params: { path: { id: 7 } },
      body: { sharing: true },
    });
    expect(shared.response.status).toBe(200);
    expect(shared.data?.call?.status).toBe("active");
    const stopped = await client.POST("/api/v1/calls/{id}/screen_share", {
      params: { path: { id: 7 } },
      body: { sharing: false },
    });
    expect(stopped.response.status).toBe(200);
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
    const globalSearch = await client.GET("/api/v1/search", { params: { query: { q: "Ping" } } });
    expect(globalSearch.data?.query).toBe("Ping");
    const emptySearch = await client.GET("/api/v1/search", { params: { query: {} } });
    expect(emptySearch.data?.query).toBe("");
    const chatSearch = await client.GET("/api/v1/conversations/{id}/search", {
      params: { path: { id: 1 }, query: { q: "See" } },
    });
    expect(chatSearch.data?.messages.length).toBeGreaterThan(0);
    const emptyChatSearch = await client.GET("/api/v1/conversations/{id}/search", {
      params: { path: { id: 1 }, query: {} },
    });
    expect(emptyChatSearch.data?.query).toBe("");
    const filteredChatSearch = await client.GET("/api/v1/conversations/{id}/search", {
      params: { path: { id: 1 }, query: { has_link: true, kind: "text", q: "See" } },
    });
    expect(filteredChatSearch.response.status).toBe(200);
    const peopleSearch = await client.GET("/api/v1/accounts/search", {
      params: { query: { q: "Adele" } },
    });
    expect(peopleSearch.response.status).toBe(200);
    expect(peopleSearch.data?.accounts.some((row) => row.display_name === "Adele Goldberg")).toBe(
      true,
    );
    const emptyPeople = await client.GET("/api/v1/accounts/search", { params: { query: {} } });
    expect(emptyPeople.data?.accounts).toEqual([]);
    expect(messageSearchHits("ab", 0)).toEqual([]);
    expect(accountSearchHits("x")).toEqual([]);
    expect(conversationSearchHits("x")).toEqual([]);
    const notes = messagingStore().conversations.find((row) => row.id === 3);
    if (notes) {
      notes.title = null;
      notes.peer = undefined;
    }
    expect(conversationSearchHits("zzzzzz")).toEqual([]);
    messagingStore().messages[1]?.push({
      body: "See ghost",
      conversation_id: 1,
      created_at: MESSAGE_STAMP,
      deleted: false,
      id: 999001,
      kind: "text",
      position: 999,
      revision: 1,
      silent: false,
    });
    expect(messageSearchHits("ghost", 1)[0]?.sender_name).toBeNull();
    const rows = messagingStore().messages[1] ?? [];
    const firstSearchRow = rows[0];
    if (firstSearchRow) {
      firstSearchRow.deleted = true;
      expect(
        messageSearchHits(firstSearchRow.body ?? "", 1).map((row) => row.message_id),
      ).not.toContain(firstSearchRow.id);
      firstSearchRow.deleted = false;
    }
    expect(messageSearchHits("", 1, { createdAfter: "2027-01-01T00:00:00.000Z" })).toEqual([]);
    expect(messageSearchHits("", 1, { createdBefore: "2025-01-01T00:00:00.000Z" })).toEqual([]);
    const ghost = rows.find((row) => row.id === 999001);
    if (ghost) {
      ghost.body = null;
    }
    expect(messageSearchHits("", 1, { hasLink: true })).toEqual([]);
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
    const regenerated = await client.POST("/api/v1/messages/{id}/regenerate", {
      params: { path: { id: sent.data?.id ?? 1 } },
    });
    expect(regenerated.data?.deleted).toBe(true);
    const missingRegen = await client.POST("/api/v1/messages/{id}/regenerate", {
      params: { path: { id: 0 } },
    });
    expect(missingRegen.response.status).toBe(404);
    const cancelledGeneration = await client.POST("/api/v1/conversations/{id}/generations/cancel", {
      params: { path: { id: 1 } },
      body: { generation_id: "g-1" },
    });
    expect(cancelledGeneration.data?.generation_id).toBe("g-1");
    const cancelledEmpty = await client.POST("/api/v1/conversations/{id}/generations/cancel", {
      params: { path: { id: 1 } },
      body: { generation_id: "" },
    });
    expect(cancelledEmpty.data?.generation_id).toBe("");
    const cancelledMissing = await fetch(
      "http://rajya.test/api/v1/conversations/1/generations/cancel",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      },
    );
    expect((await cancelledMissing.json()).generation_id).toBe("");
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
    const commands = await client.GET("/api/v1/conversations/{id}/commands", {
      params: { path: { id: 1 } },
    });
    expect(commands.data?.commands.some((row) => row.name === "plan")).toBe(true);
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
    const packs = await client.GET("/api/v1/sticker_packs");
    expect(packs.data?.sticker_packs).toHaveLength(1);
    const createdPack = await client.POST("/api/v1/sticker_packs", {
      body: { name: "Waves", kind: "sticker" },
    });
    expect(createdPack.response.status).toBe(201);
    const patchedPack = await client.PATCH("/api/v1/sticker_packs/{id}", {
      params: { path: { id: 1 } },
      body: { published: true },
    });
    expect(patchedPack.data?.id).toBe(1);
    const addedSticker = await client.POST("/api/v1/sticker_packs/{sticker_pack_id}/stickers", {
      params: { path: { sticker_pack_id: 1 } },
      body: { signed_id: "signed", shortcode: "wave" },
    });
    expect(addedSticker.response.status).toBe(201);
    const removedSticker = await client.DELETE(
      "/api/v1/sticker_packs/{sticker_pack_id}/stickers/{id}",
      { params: { path: { sticker_pack_id: 1, id: 1 } } },
    );
    expect(removedSticker.data?.ok).toBe(true);
    const deletedPack = await client.DELETE("/api/v1/sticker_packs/{id}", {
      params: { path: { id: 1 } },
    });
    expect(deletedPack.data?.ok).toBe(true);
    const gifs = await client.GET("/api/v1/gifs", { params: { query: { q: "party" } } });
    expect(gifs.data?.gifs).toHaveLength(1);
    const defaultGifs = await client.GET("/api/v1/gifs");
    expect(defaultGifs.data?.gifs).toHaveLength(1);
    const missingGifs = await client.GET("/api/v1/gifs", { params: { query: { q: "fail" } } });
    expect(missingGifs.response.status).toBe(404);
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
    const vapid = await client.GET("/api/v1/push_subscriptions/vapid");
    expect(vapid.data?.public_key).toBe("vapid-public");
    const subscribed = await client.POST("/api/v1/push_subscriptions", {
      body: { endpoint: "https://push.example/1", keys: { p256dh: "p", auth: "a" } },
    });
    expect(subscribed.response.status).toBe(201);
    const unsubscribed = await client.DELETE("/api/v1/push_subscriptions", {
      params: { query: { endpoint: "https://push.example/1" } },
    });
    expect(unsubscribed.data?.ok).toBe(true);
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
    const presign = await client.POST("/api/v1/direct_uploads", {
      body: { filename: "a.png", byte_size: 1, checksum: "abc", content_type: "image/png" },
    });
    expect(presign.data?.blob_signed_id).toBe("signed");
    const media = await client.GET("/api/v1/conversations/{id}/media", {
      params: { path: { id: 1 } },
    });
    expect(media.data?.meta.has_more).toBe(true);
    const mediaPage = await client.GET("/api/v1/conversations/{id}/media", {
      params: { path: { id: 1 }, query: { kind: "images", page: 2 } },
    });
    expect(mediaPage.data?.meta.has_more).toBe(false);
    const retried = await client.POST("/api/v1/attachments/{id}/retry", {
      params: { path: { id: 1 } },
    });
    expect(retried.data?.processing_status).toBe("pending");
    const transcribed = await client.POST("/api/v1/attachments/{id}/transcribe", {
      params: { path: { id: 1 } },
    });
    expect(transcribed.data?.transcript_status).toBe("pending");
    const exportsListed = await client.GET("/api/v1/export_jobs");
    expect(exportsListed.data?.export_jobs).toHaveLength(1);
    const exportCreated = await client.POST("/api/v1/export_jobs", { body: { format: "json" } });
    expect(exportCreated.response.status).toBe(201);
    const exportShown = await client.GET("/api/v1/export_jobs/{id}", {
      params: { path: { id: 1 } },
    });
    expect(exportShown.data?.id).toBe(1);
    const exportUrl = await client.GET("/api/v1/export_jobs/{id}/download", {
      params: { path: { id: 1 } },
    });
    expect(exportUrl.data?.url).toContain("export");
  });
});
