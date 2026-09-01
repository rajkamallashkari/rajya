import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "@/shared/lib/api/client";
import {
  getThemeOverridePalette,
  listAdminFeatureFlags,
  listAdminSettings,
  listAdminThemeOverrides,
  listAdminTranslationStrings,
  resetAdminSetting,
  resetAdminThemeOverrides,
  resetAdminTranslationString,
  updateAdminFeatureFlag,
  updateAdminSetting,
  updateAdminThemeOverride,
  updateAdminTranslationString,
} from "./http";

const get = vi.fn();
const patch = vi.fn();
const del = vi.fn();

describe("admin configuration API", () => {
  beforeEach(() => {
    get.mockReset();
    patch.mockReset();
    del.mockReset();
    vi.spyOn(apiClient, "createApiClient").mockReturnValue({
      GET: get,
      PATCH: patch,
      DELETE: del,
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
});
