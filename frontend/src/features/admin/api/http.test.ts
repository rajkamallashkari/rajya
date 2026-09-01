import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "@/shared/lib/api/client";
import {
  approveAdminBotRequest,
  declineAdminBotRequest,
  getAdminDashboard,
  getAdminUser,
  getThemeOverridePalette,
  listAdminAuditEvents,
  listAdminBotRequests,
  listAdminFeatureFlags,
  listAdminPromptTemplates,
  listAdminSettings,
  listAdminThemeOverrides,
  listAdminTranscript,
  listAdminTranslationStrings,
  listAdminUsers,
  resetAdminSetting,
  resetAdminThemeOverrides,
  resetAdminTranslationString,
  startAdminImpersonation,
  stopAdminImpersonation,
  updateAdminFeatureFlag,
  updateAdminPromptTemplate,
  updateAdminSetting,
  updateAdminThemeOverride,
  updateAdminTranslationString,
} from "./http";

const get = vi.fn();
const patch = vi.fn();
const del = vi.fn();
const post = vi.fn();

describe("admin configuration API", () => {
  beforeEach(() => {
    get.mockReset();
    patch.mockReset();
    del.mockReset();
    post.mockReset();
    vi.spyOn(apiClient, "createApiClient").mockReturnValue({
      GET: get,
      PATCH: patch,
      DELETE: del,
      POST: post,
    } as unknown as ReturnType<typeof apiClient.createApiClient>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists and mutates settings, flags, strings, and colours", async () => {
    get.mockResolvedValue({ data: { settings: [], unregistered_keys: [] } });
    await expect(listAdminSettings()).resolves.toEqual({ settings: [], unregistered_keys: [] });
    patch.mockResolvedValue({ data: { setting: { key: "message_edit_window" } } });
    await expect(updateAdminSetting("message_edit_window", 60)).resolves.toMatchObject({
      setting: { key: "message_edit_window" },
    });
    del.mockResolvedValue({ data: { setting: { key: "message_edit_window" } } });
    await expect(resetAdminSetting("message_edit_window")).resolves.toMatchObject({
      setting: { key: "message_edit_window" },
    });
    get.mockResolvedValue({ data: { feature_flags: [], unregistered_keys: [] } });
    await expect(listAdminFeatureFlags()).resolves.toEqual({
      feature_flags: [],
      unregistered_keys: [],
    });
    patch.mockResolvedValue({ data: { feature_flag: { key: "webrtc_calls" } } });
    await expect(updateAdminFeatureFlag("webrtc_calls", true, {})).resolves.toMatchObject({
      feature_flag: { key: "webrtc_calls" },
    });
    get.mockResolvedValue({ data: { translation_strings: [] } });
    await expect(listAdminTranslationStrings({ q: "a", surface: "errors" })).resolves.toEqual({
      translation_strings: [],
    });
    await expect(listAdminTranslationStrings()).resolves.toEqual({ translation_strings: [] });
    patch.mockResolvedValue({ data: { translation_string: { key: "errors.not_found" } } });
    await expect(
      updateAdminTranslationString("errors.not_found", "Gone", "es"),
    ).resolves.toMatchObject({
      translation_string: { key: "errors.not_found" },
    });
    del.mockResolvedValue({ data: { translation_string: { key: "errors.not_found" } } });
    await expect(resetAdminTranslationString("errors.not_found", "es")).resolves.toMatchObject({
      translation_string: { key: "errors.not_found" },
    });
    get.mockResolvedValue({ data: { themes: { light: [] } } });
    await expect(listAdminThemeOverrides()).resolves.toEqual({ themes: { light: [] } });
    patch.mockResolvedValue({ data: { override: { token_name: "--text-primary" } } });
    await expect(
      updateAdminThemeOverride("light", "--text-primary", "var(--accent)"),
    ).resolves.toMatchObject({
      override: { token_name: "--text-primary" },
    });
    del.mockResolvedValue({ data: { themes: {} } });
    await expect(resetAdminThemeOverrides()).resolves.toEqual({ themes: {} });
    await expect(resetAdminThemeOverrides("light", "--text-primary")).resolves.toEqual({
      themes: {},
    });
    get.mockResolvedValue({ data: { light: {}, dark: {} } });
    await expect(getThemeOverridePalette()).resolves.toEqual({ light: {}, dark: {} });
  });

  it("lists users, transcripts, audit, dashboards, prompts, and bot requests", async () => {
    get.mockResolvedValue({ data: { users: [] } });
    await expect(listAdminUsers("ada")).resolves.toEqual({ users: [] });
    await expect(listAdminUsers()).resolves.toEqual({ users: [] });
    get.mockResolvedValue({ data: { user: { id: 1 }, conversations: [] } });
    await expect(getAdminUser(1)).resolves.toMatchObject({ user: { id: 1 } });
    get.mockResolvedValue({ data: { messages: [], meta: {} } });
    await expect(listAdminTranscript(1, { before: 2 })).resolves.toMatchObject({ messages: [] });
    await expect(listAdminTranscript(1)).resolves.toMatchObject({ messages: [] });
    post.mockResolvedValue({ data: { token: "impersonation-token" } });
    await expect(startAdminImpersonation(2)).resolves.toMatchObject({
      token: "impersonation-token",
    });
    del.mockResolvedValue({ data: { ok: true } });
    await expect(stopAdminImpersonation()).resolves.toEqual({ ok: true });
    get.mockResolvedValue({ data: { audit_events: [] } });
    await expect(listAdminAuditEvents("transcript.read")).resolves.toEqual({ audit_events: [] });
    await expect(listAdminAuditEvents()).resolves.toEqual({ audit_events: [] });
    get.mockResolvedValue({ data: { buckets: [] } });
    await expect(getAdminDashboard()).resolves.toEqual({ buckets: [] });
    get.mockResolvedValue({ data: { prompt_templates: [] } });
    await expect(listAdminPromptTemplates()).resolves.toEqual({ prompt_templates: [] });
    patch.mockResolvedValue({ data: { prompt_template: { capability: "bot_reply" } } });
    await expect(updateAdminPromptTemplate("bot_reply", "Hi")).resolves.toMatchObject({
      prompt_template: { capability: "bot_reply" },
    });
    get.mockResolvedValue({ data: { bot_requests: [] } });
    await expect(listAdminBotRequests()).resolves.toEqual({ bot_requests: [] });
    post.mockResolvedValue({ data: { id: 1 } });
    await expect(approveAdminBotRequest(1)).resolves.toEqual({ id: 1 });
    await expect(declineAdminBotRequest(1, "Too thin")).resolves.toEqual({ id: 1 });
    await expect(declineAdminBotRequest(1)).resolves.toEqual({ id: 1 });
  });
});
