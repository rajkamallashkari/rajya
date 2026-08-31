import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "@/shared/lib/api/client";
import {
  createExportJob,
  destroyContactNickname,
  downloadExportJob,
  getPreferences,
  listAccentConfigs,
  listContactNicknames,
  listDeviceSessions,
  listExportJobs,
  listFontConfigs,
  revokeDeviceSession,
  revokeOtherDeviceSessions,
  updatePreferences,
  upsertContactNickname,
} from "@/features/settings/api/http";

const get = vi.fn();
const patch = vi.fn();
const post = vi.fn();
const put = vi.fn();
const del = vi.fn();

const envelope = {
  data: { appearance: { theme: "system" } },
  updated_at: "2026-08-31T12:00:00Z",
};

describe("preferences API", () => {
  beforeEach(() => {
    get.mockReset();
    patch.mockReset();
    post.mockReset();
    put.mockReset();
    del.mockReset();
    vi.spyOn(apiClient, "createApiClient").mockReturnValue({
      GET: get,
      PATCH: patch,
      POST: post,
      PUT: put,
      DELETE: del,
    } as unknown as ReturnType<typeof apiClient.createApiClient>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads and patches the preference document", async () => {
    get.mockResolvedValue({ data: envelope });
    patch.mockResolvedValue({
      data: { ...envelope, data: { appearance: { theme: "dark" } } },
    });
    await expect(getPreferences()).resolves.toEqual(envelope);
    await expect(updatePreferences({ appearance: { theme: "dark" } })).resolves.toMatchObject({
      data: { appearance: { theme: "dark" } },
    });
    get.mockResolvedValue({ data: { font_configs: [{ id: 1, name: "System", font_family_value: "inherit" }] } });
    await expect(listFontConfigs()).resolves.toMatchObject({ font_configs: [{ id: 1 }] });
    get.mockResolvedValue({
      data: {
        accent_configs: [
          { id: "cyber_indigo", label: "Cyber Indigo", hex: "var(--accent)", is_light_compatible: true, is_dark_compatible: true },
        ],
      },
    });
    await expect(listAccentConfigs()).resolves.toMatchObject({
      accent_configs: [{ id: "cyber_indigo" }],
    });
  });

  it("manages devices, nicknames, and export jobs", async () => {
    get.mockResolvedValue({ data: { sessions: [{ id: 1, current: true }] } });
    await expect(listDeviceSessions()).resolves.toMatchObject({ sessions: [{ id: 1 }] });
    del.mockResolvedValue({ data: { ok: true } });
    await expect(revokeDeviceSession(2)).resolves.toEqual({ ok: true });
    await expect(revokeOtherDeviceSessions()).resolves.toEqual({ ok: true });
    get.mockResolvedValue({ data: { nicknames: [{ nickname: "Ada", account: { id: 2 } }] } });
    await expect(listContactNicknames()).resolves.toMatchObject({ nicknames: [{ nickname: "Ada" }] });
    put.mockResolvedValue({ data: { nickname: "Key", account: { id: 2 } } });
    await expect(upsertContactNickname(2, "Key")).resolves.toMatchObject({ nickname: "Key" });
    await expect(destroyContactNickname(2)).resolves.toEqual({ ok: true });
    get.mockResolvedValue({ data: { export_jobs: [{ id: 1, status: "pending" }] } });
    await expect(listExportJobs()).resolves.toMatchObject({ export_jobs: [{ id: 1 }] });
    post.mockResolvedValue({ data: { id: 1, format: "json", status: "pending" } });
    await expect(createExportJob({ format: "txt", include_media: true, conversation_id: 3 })).resolves.toMatchObject({
      id: 1,
    });
    get.mockResolvedValue({ data: { url: "https://media.test/export", expires_at: "2099-01-01T00:00:00Z" } });
    await expect(downloadExportJob(1)).resolves.toMatchObject({ url: "https://media.test/export" });
  });
});
