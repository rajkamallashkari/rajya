import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as apiClient from "@/shared/lib/api/client";
import { getPreferences, listAccentConfigs, listFontConfigs, updatePreferences } from "@/features/settings";

const get = vi.fn();
const patch = vi.fn();

const envelope = {
  data: { appearance: { theme: "system" } },
  updated_at: "2026-08-31T12:00:00Z",
};

describe("preferences API", () => {
  beforeEach(() => {
    get.mockReset();
    patch.mockReset();
    vi.spyOn(apiClient, "createApiClient").mockReturnValue({
      GET: get,
      PATCH: patch,
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
});
