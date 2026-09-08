import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { ChatsWelcome } from "@/features/conversations/components/chats-welcome";
import { useComposeStore } from "@/features/conversations/store/compose-store";
import { en } from "@/shared/lib/i18n/catalog";

describe("ChatsWelcome", () => {
  it("renders the empty chat column with a new-chat action", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <ChatsWelcome />
      </AppProviders>,
    );
    expect(document.querySelector("[data-chats-welcome]")).not.toBeNull();
    expect(screen.getByText(en.shell.welcome_title)).toBeInTheDocument();
    expect(screen.getByText(en.shell.welcome_description)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.shell.welcome_action })).toBeInTheDocument();
    expect(screen.getByAltText(en.brand.logo_alt)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.shell.welcome_action }));
    expect(useComposeStore.getState().menuOpen).toBe(true);
  });
});
