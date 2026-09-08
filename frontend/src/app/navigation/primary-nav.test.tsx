import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PrimaryNav } from "./primary-nav";
import { AppProviders } from "@/app/providers";
import { useShellStore } from "@/features/settings/store/shell-store";
import { en } from "@/shared/lib/i18n/catalog";

describe("PrimaryNav", () => {
  it("switches destinations from the rail", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <PrimaryNav placement="rail" />
      </AppProviders>,
    );
    expect(screen.getByRole("navigation", { name: en.shell.tabs_aria })).toHaveAttribute(
      "data-primary-nav",
      "rail",
    );
    expect(screen.getByRole("button", { name: en.shell.chats })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await user.click(screen.getByRole("button", { name: en.shell.calls }));
    expect(useShellStore.getState().destination).toBe("calls");
    expect(screen.getByRole("button", { name: en.shell.calls })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: en.shell.chats })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("renders the bottom bar placement", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <PrimaryNav placement="bar" />
      </AppProviders>,
    );
    expect(screen.getByRole("navigation", { name: en.shell.tabs_aria })).toHaveAttribute(
      "data-primary-nav",
      "bar",
    );
    await user.click(screen.getByRole("button", { name: en.shell.profile }));
    expect(useShellStore.getState().destination).toBe("profile");
  });
});
