import { type ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { AppearancePanel } from "./appearance-panel";
import { SessionListItem } from "./session-list-item";
import { SettingsPanel } from "./settings-panel";
import { WallpaperPicker } from "./wallpaper-picker";
import { AppProviders } from "@/app/providers";
import { setAccessSession } from "@/features/auth/model/access-session";
import { DEFAULT_QUICK_REACTIONS } from "@/features/messages/model/menu";
import { en } from "@/shared/lib/i18n/catalog";
import { seedPreferenceOverlay } from "@/shared/lib/api/msw/handlers";
import { testSession } from "@/test/access-session";
import { server } from "@/test/msw";

function wrap(ui: ReactNode) {
  return <AppProviders>{ui}</AppProviders>;
}

describe("AppearancePanel", () => {
  it("writes token-backed appearance settings", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(wrap(<AppearancePanel />));
    await screen.findByRole("button", { name: "Cyber Indigo" });
    await user.click(screen.getByRole("button", { name: "Ember" }));
    await user.click(screen.getByRole("button", { name: en.appearance.theme_option.dark }));
    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
    await user.click(screen.getByRole("switch", { name: en.appearance.split_accents }));
    await user.click(screen.getByRole("button", { name: "Ember" }));
    await user.click(screen.getByRole("button", { name: en.appearance.theme_option.light }));
    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
    await user.click(screen.getByRole("button", { name: "Ember" }));
    await user.click(screen.getByRole("button", { name: en.appearance.theme_option.dark }));
    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
    await user.click(screen.getByRole("button", { name: "Inter" }));
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--app-font-family")).toContain("Inter");
    });
    await user.click(screen.getByRole("button", { name: en.appearance.corner.square }));
    await waitFor(() => {
      expect(document.documentElement.dataset.corners).toBe("square");
    });
    await user.click(screen.getByRole("switch", { name: en.appearance.timestamps }));
    await waitFor(() => {
      expect(document.documentElement.dataset.timestamps).toBe("always");
    });
    await user.click(screen.getByRole("switch", { name: en.appearance.reduce_transparency }));
    await waitFor(() => {
      expect(document.documentElement.dataset.transparency).toBe("reduced");
    });
    await user.click(screen.getByRole("button", { name: en.appearance.autoplay_policy.never }));
    await waitFor(() => {
      expect(document.documentElement.dataset.autoplay).toBe("never");
    });
    const skin = screen.getByRole("slider", { name: en.appearance.skin_tone });
    skin.focus();
    await user.keyboard("{ArrowRight}");
    await waitFor(() => {
      expect(document.documentElement.dataset.skinTone).not.toBe("0");
    });
    const size = screen.getByRole("slider", { name: en.appearance.text_size });
    size.focus();
    await user.keyboard("{End}");
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--app-size-multiplier")).toBe("1.3");
    });
    const weight = screen.getByRole("slider", { name: en.appearance.text_weight });
    weight.focus();
    await user.keyboard("{End}");
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--app-font-weight")).toBe("700");
    });
    const lineHeight = screen.getByRole("slider", { name: en.appearance.text_line_height });
    lineHeight.focus();
    await user.keyboard("{End}");
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--app-line-height")).toBe("1.9");
    });
    const letterSpacing = screen.getByRole("slider", { name: en.appearance.text_letter_spacing });
    letterSpacing.focus();
    await user.keyboard("{End}");
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--app-letter-spacing")).toBe("0.04em");
    });
    await user.click(screen.getByRole("button", { name: en.appearance.density_option.compact }));
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue("--space-list-y")).toBe("var(--space-2)");
    });
    const slot = screen.getByRole("textbox", { name: en.settings.quick_reaction_slot.replace("{{n}}", "1") });
    await user.clear(slot);
    await user.type(slot, "🎉");
    expect(slot).toHaveValue("🎉");
  });
});

describe("SettingsPanel", () => {
  it("renders the appearance surface", async () => {
    render(wrap(<SettingsPanel />));
    expect(document.querySelector("[data-settings-panel]")).not.toBeNull();
    expect(await screen.findByText(en.settings.appearance)).toBeInTheDocument();
  });

  it("hides catalogue pickers when the APIs return nothing", async () => {
    server.use(
      http.get("*/api/v1/font_configs", () => HttpResponse.json({ font_configs: [] })),
      http.get("*/api/v1/accent_configs", () => HttpResponse.json({ accent_configs: [] })),
    );
    render(wrap(<AppearancePanel />));
    expect(
      await screen.findByRole("button", { name: en.appearance.theme_option.dark }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cyber Indigo" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Inter" })).toBeNull();
  });

  it("fills missing quick-reaction slots from defaults", async () => {
    seedPreferenceOverlay({ chat: { quick_reactions: ["🎉"] } });
    render(wrap(<AppearancePanel />));
    await waitFor(() => {
      expect(
        screen.getByRole("textbox", {
          name: en.settings.quick_reaction_slot.replace("{{n}}", "1"),
        }),
      ).toHaveValue("🎉");
    });
    expect(
      screen.getByRole("textbox", {
        name: en.settings.quick_reaction_slot.replace("{{n}}", "2"),
      }),
    ).toHaveValue(DEFAULT_QUICK_REACTIONS[1] ?? "❤️");
  });
});

describe("WallpaperPicker", () => {
  it("applies presets and rejects unreadable dim", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(wrap(<SettingsPanel />));
    await screen.findByRole("button", { name: "Cyber Indigo" });
    await user.click(screen.getByRole("button", { name: en.appearance.theme_option.light }));
    await user.click(screen.getByRole("button", { name: en.wallpaper.presets.dusk }));
    await waitFor(() => {
      expect(document.documentElement.dataset.wallpaper).toBe("dusk");
    });
    const blur = screen.getByRole("slider", { name: en.wallpaper.blur });
    blur.focus();
    await user.keyboard("{ArrowRight}");
    const dim = screen.getByRole("slider", { name: en.wallpaper.dim });
    dim.focus();
    await user.keyboard("{End}");
    expect(screen.getByText(en.wallpaper.contrast_fail)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.wallpaper.presets.mist }));
    expect(screen.queryByText(en.wallpaper.contrast_fail)).toBeNull();
  });

  it("stores a membership override and can restore the account default", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    render(wrap(<WallpaperPicker conversationId={1} />));
    expect(await screen.findByRole("button", { name: en.wallpaper.use_default })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.wallpaper.presets.dusk }));
    await user.click(screen.getByRole("button", { name: en.wallpaper.use_default }));
  });
});

describe("SessionListItem", () => {
  it("revokes other devices and hides the control on the current session", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onRevoke = vi.fn();
    const { rerender } = render(
      <SessionListItem
        onRevoke={onRevoke}
        session={{
          current: false,
          deviceLabel: "Phone",
          expiresAt: "2026-09-01T00:00:00.000Z",
          id: "1",
          ip: "1.1.1.1",
          lastSeenAt: "2026-08-29T12:00:00.000Z",
          revoked: false,
          userAgent: "Safari",
        }}
      />,
    );
    await user.click(screen.getByRole("button", { name: en.sessions.revoke }));
    expect(onRevoke).toHaveBeenCalledWith("1");
    rerender(
      <SessionListItem
        session={{
          current: true,
          deviceLabel: null,
          expiresAt: "2026-09-01T00:00:00.000Z",
          id: "2",
          ip: null,
          lastSeenAt: "2026-08-29T12:00:00.000Z",
          revoked: false,
          userAgent: null,
        }}
      />,
    );
    expect(screen.getByText(en.sessions.current)).toBeInTheDocument();
    expect(screen.getByText(en.sessions.unknown_device)).toBeInTheDocument();
    rerender(
      <SessionListItem
        onRevoke={onRevoke}
        session={{
          current: false,
          deviceLabel: "Old",
          expiresAt: "2026-09-01T00:00:00.000Z",
          id: "3",
          ip: null,
          lastSeenAt: "2026-08-29T12:00:00.000Z",
          revoked: true,
          userAgent: null,
        }}
      />,
    );
    expect(screen.queryByRole("button", { name: en.sessions.revoke })).toBeNull();
  });
});
