import { type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/app/theme-provider";
import { AppearancePanel } from "./appearance-panel";
import { SessionListItem } from "./session-list-item";
import { WallpaperPicker } from "./wallpaper-picker";
import { defaultThemeInput } from "@/shared/lib/theme";
import { en } from "@/shared/lib/i18n/catalog";

function wrap(ui: ReactNode) {
  return <ThemeProvider input={{ ...defaultThemeInput(), theme: "light" }}>{ui}</ThemeProvider>;
}

describe("AppearancePanel", () => {
  it("writes token-backed appearance settings", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(wrap(<AppearancePanel />));
    await user.click(screen.getByRole("button", { name: en.appearance.corner.square }));
    expect(document.documentElement.dataset.corners).toBe("square");
    await user.click(screen.getByRole("switch", { name: en.appearance.timestamps }));
    expect(document.documentElement.dataset.timestamps).toBe("always");
    await user.click(screen.getByRole("switch", { name: en.appearance.reduce_transparency }));
    expect(document.documentElement.dataset.transparency).toBe("reduced");
    await user.click(screen.getByRole("button", { name: en.appearance.autoplay_policy.never }));
    expect(document.documentElement.dataset.autoplay).toBe("never");
    const skin = screen.getByRole("slider", { name: en.appearance.skin_tone });
    skin.focus();
    await user.keyboard("{ArrowRight}");
    expect(document.documentElement.dataset.skinTone).not.toBe("0");
  });
});

describe("WallpaperPicker", () => {
  it("applies presets and rejects unreadable dim", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(wrap(<WallpaperPicker />));
    await user.click(screen.getByRole("button", { name: en.wallpaper.presets.dusk }));
    expect(document.documentElement.dataset.wallpaper).toBe("dusk");
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
