import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { setAccessSession } from "@/features/auth/model/access-session";
import { persistSession } from "@/features/auth/model/persist-session";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import preferencesRegistry from "@/shared/lib/config/preferences-registry.json";
import { en } from "@/shared/lib/i18n/catalog";
import { server } from "@/test/msw";
import { SelfProfilePane } from "./self-profile-pane";

function seedAccount(): void {
  setAccessSession({
    accountId: 1,
    displayName: "Ada",
    hasPasskey: false,
    hasPassword: true,
    onboarded: true,
    token: "tok",
    username: "ada",
  });
  persistSession({
    account: { display_name: "Ada", id: 1, username: "ada" },
    token: "tok",
    user: { has_passkey: false, has_password: true, onboarded: true },
  });
}

describe("SelfProfilePane", () => {
  beforeEach(seedAccount);

  it("shows profile fields, cancels edits, and saves inline", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <SelfProfilePane />
      </AppProviders>,
    );

    expect(await screen.findByText("Building small tools.")).toBeInTheDocument();
    expect(screen.getByText("@ada")).toBeInTheDocument();
    expect(screen.queryByText("ada@example.com")).toBeNull();
    expect(screen.queryByText("+12025550147")).toBeNull();

    await user.click(screen.getByRole("button", { name: en.auth.profile.edit }));
    await user.clear(screen.getByLabelText(en.auth.onboarding.display_name));
    await user.type(screen.getByLabelText(en.auth.onboarding.display_name), "Temporary");
    await user.click(screen.getByRole("button", { name: en.auth.profile.cancel }));
    expect(screen.getByRole("heading", { name: "Ada" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: en.auth.profile.edit }));
    await user.clear(screen.getByLabelText(en.auth.onboarding.display_name));
    await user.type(screen.getByLabelText(en.auth.onboarding.display_name), "Ada Lovelace");
    await user.clear(screen.getByLabelText(en.auth.onboarding.bio));
    await user.type(screen.getByLabelText(en.auth.onboarding.bio), "Computing pioneer.");
    await user.click(screen.getByRole("button", { name: en.auth.profile.save }));
    expect(await screen.findByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();
    expect(screen.getByText("Computing pioneer.")).toBeInTheDocument();
    expect(useAccountsStore.getState().accounts[0]?.displayName).toBe("Ada Lovelace");
  });

  it("shows only contact fields enabled by privacy preferences", async () => {
    server.use(
      http.get("*/api/v1/preferences", () =>
        HttpResponse.json({
          data: {
            ...preferencesRegistry.defaults,
            privacy: {
              ...preferencesRegistry.defaults.privacy,
              show_email_on_profile: true,
              show_phone_on_profile: true,
            },
          },
          updated_at: null,
        }),
      ),
      http.get("*/api/v1/users/me", () =>
        HttpResponse.json({
          account: {
            bio: null,
            display_name: "Ada",
            id: 1,
            kind: "human",
            username: "ada",
          },
          user: {
            email: "ada@example.com",
            has_passkey: false,
            has_password: true,
            id: 1,
            is_admin: false,
            onboarded: true,
            phone: "+12025550147",
            phone_verified: true,
          },
        }),
      ),
    );
    render(
      <AppProviders>
        <SelfProfilePane />
      </AppProviders>,
    );
    expect(await screen.findByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("+12025550147")).toBeInTheDocument();
  });

  it("validates edits and surfaces unavailable usernames and save failures", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <SelfProfilePane />
      </AppProviders>,
    );
    await user.click(await screen.findByRole("button", { name: en.auth.profile.edit }));
    const name = screen.getByLabelText(en.auth.onboarding.display_name);
    const username = screen.getByLabelText(en.auth.onboarding.username);

    await user.clear(name);
    await user.click(screen.getByRole("button", { name: en.auth.profile.save }));
    expect(screen.getByText(en.auth.profile.name_blank)).toBeInTheDocument();

    await user.type(name, "Ada");
    await user.clear(username);
    await user.type(username, "ab");
    await user.click(screen.getByRole("button", { name: en.auth.profile.save }));
    expect(screen.getByText(en.auth.profile.username_short)).toBeInTheDocument();

    server.use(
      http.get("*/api/v1/accounts/username", () => HttpResponse.json({ available: false })),
    );
    await user.clear(username);
    await user.type(username, "taken");
    await user.click(screen.getByRole("button", { name: en.auth.profile.save }));
    expect(screen.getByText(en.auth.onboarding.username_taken)).toBeInTheDocument();

    server.use(
      http.get("*/api/v1/accounts/username", () => HttpResponse.json({ available: true })),
      http.patch("*/api/v1/users/me", () => HttpResponse.json({}, { status: 500 })),
    );
    await user.clear(username);
    await user.type(username, "available");
    await user.click(screen.getByRole("button", { name: en.auth.profile.save }));
    expect(await screen.findByText(en.auth.onboarding.profile_failed)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.auth.profile.cancel }));
    expect(screen.queryByText(en.auth.onboarding.profile_failed)).toBeNull();
  });

  it("retries loading the profile after an identity error", async () => {
    const user = userEvent.setup();
    let attempts = 0;
    server.use(
      http.get("*/api/v1/users/me", () => {
        attempts += 1;
        if (attempts === 1) {
          return HttpResponse.json({}, { status: 500 });
        }
        return HttpResponse.json({
          account: {
            bio: "Building small tools.",
            display_name: "Ada",
            id: 1,
            kind: "human",
            username: "ada",
          },
          user: {
            email: "ada@example.com",
            has_passkey: false,
            has_password: true,
            id: 1,
            is_admin: false,
            onboarded: true,
            phone: null,
            phone_verified: false,
          },
        });
      }),
    );
    render(
      <AppProviders>
        <SelfProfilePane />
      </AppProviders>,
    );
    await user.click(await screen.findByRole("button", { name: en.lists.error_retry }));
    expect(await screen.findByRole("heading", { name: "Ada" })).toBeInTheDocument();
  });

  it("opens the account switcher on right click and activates another account", async () => {
    const user = userEvent.setup();
    useAccountsStore.getState().upsertAccount({
      displayName: "Bob",
      hasPasskey: false,
      hasPassword: true,
      id: 2,
      onboarded: true,
      token: "tok-2",
      username: "bob",
    });
    render(
      <AppProviders>
        <SelfProfilePane />
      </AppProviders>,
    );
    const identity = await screen.findByRole("button", { name: en.auth.accounts.switcher });
    fireEvent.contextMenu(identity);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Bob.*@bob/ }));
    await waitFor(() => {
      expect(useAccountsStore.getState().activeAccountId).toBe(2);
    });
    fireEvent.contextMenu(screen.getByRole("button", { name: en.auth.accounts.switcher }));
    await user.click(screen.getByRole("button", { name: en.auth.accounts.logout_all }));
    expect(useAccountsStore.getState().accounts).toEqual([]);
  });
});
