import { type ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { AVATAR_MAX_BYTES } from "@/features/auth/model/limits";
import { setAccessSession } from "@/features/auth/model/access-session";
import { persistSession } from "@/features/auth/model/persist-session";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import preferencesRegistry from "@/shared/lib/config/preferences-registry.json";
import { en } from "@/shared/lib/i18n/catalog";
import { server } from "@/test/msw";
import { SelfProfilePane } from "./self-profile-pane";

const ADMIN_SHELL_STUB = "admin shell reached";
const AVATAR_TOO_LARGE_BYTES = AVATAR_MAX_BYTES + 1;

function wrap(ui: ReactNode) {
  return (
    <AppProviders>
      <MemoryRouter>{ui}</MemoryRouter>
    </AppProviders>
  );
}

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
  beforeEach(() => {
    seedAccount();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:avatar"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("shows profile fields, cancels edits, and saves inline", async () => {
    const user = userEvent.setup();
    render(wrap(<SelfProfilePane />));

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
    render(wrap(<SelfProfilePane />));
    expect(await screen.findByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("+12025550147")).toBeInTheDocument();
  });

  it("validates edits and surfaces unavailable usernames and save failures", async () => {
    const user = userEvent.setup();
    render(wrap(<SelfProfilePane />));
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

  it("checks username availability after a debounce", async () => {
    const user = userEvent.setup();
    const checked: string[] = [];
    server.use(
      http.get("*/api/v1/accounts/username", ({ request }) => {
        const username = new URL(request.url).searchParams.get("username") ?? "";
        checked.push(username);
        return HttpResponse.json({ available: username === "available" });
      }),
    );
    render(wrap(<SelfProfilePane />));
    await user.click(await screen.findByRole("button", { name: en.auth.profile.edit }));
    const username = screen.getByLabelText(en.auth.onboarding.username);

    await user.clear(username);
    await user.type(username, "bad-name");
    expect(screen.getByText(en.auth.profile.username_invalid)).toBeInTheDocument();
    expect(checked).toEqual([]);
    await user.click(screen.getByRole("button", { name: en.auth.profile.save }));
    expect(screen.getByText(en.auth.profile.username_invalid)).toBeInTheDocument();

    await user.clear(username);
    await user.type(username, "taken");
    expect(screen.getByText(en.auth.profile.username_checking)).toBeInTheDocument();
    expect(await screen.findByText(en.auth.profile.username_taken)).toBeInTheDocument();

    server.use(
      http.get("*/api/v1/accounts/username", () => HttpResponse.json({}, { status: 500 })),
    );
    await user.clear(username);
    await user.type(username, "uncheckable");
    expect(await screen.findByText(en.auth.profile.username_invalid)).toBeInTheDocument();

    server.use(
      http.get("*/api/v1/accounts/username", () => HttpResponse.json({ available: true })),
    );
    await user.clear(username);
    await user.type(username, "available");
    expect(await screen.findByText(en.auth.profile.username_available)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.auth.profile.save }));
    expect(checked).toEqual(["taken"]);
  });

  it("validates, previews, uploads, cancels, and removes an avatar", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const updates: Array<{ avatar?: string | null }> = [];
    let avatarUrl: string | null = "https://media.test/original";
    let failRemove = false;
    let failUpload = false;
    const profile = () => ({
      account: {
        avatar_url: avatarUrl,
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
        phone: null,
        phone_verified: false,
      },
    });
    server.use(
      http.get("*/api/v1/users/me", () => HttpResponse.json(profile())),
      http.patch("*/api/v1/users/me", async ({ request }) => {
        const body = (await request.json()) as { avatar?: string | null };
        updates.push(body);
        if (failRemove && body.avatar === null) {
          return HttpResponse.json({}, { status: 500 });
        }
        if ("avatar" in body) {
          avatarUrl = body.avatar ? "https://media.test/new" : null;
        }
        return HttpResponse.json(profile());
      }),
      http.post("*/api/v1/direct_uploads", () =>
        failUpload
          ? HttpResponse.json({}, { status: 500 })
          : HttpResponse.json({ blob_signed_id: "signed", skip_upload: true }),
      ),
    );
    const { container } = render(wrap(<SelfProfilePane />));
    await user.click(await screen.findByRole("button", { name: en.auth.profile.edit }));
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const inputClick = vi.spyOn(input, "click");
    await user.click(screen.getByRole("button", { name: en.auth.profile.avatar_change }));
    expect(inputClick).toHaveBeenCalled();

    fireEvent.change(input, { target: { files: [] } });
    await user.upload(input, new File(["text"], "avatar.txt", { type: "text/plain" }));
    expect(screen.getByText(en.auth.profile.avatar_file_invalid)).toBeInTheDocument();
    await user.upload(
      input,
      new File([new Uint8Array(AVATAR_TOO_LARGE_BYTES)], "large.png", { type: "image/png" }),
    );
    expect(screen.getByText(en.auth.profile.avatar_size_invalid)).toBeInTheDocument();

    await user.upload(input, new File(["png"], "avatar.png", { type: "image/png" }));
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: en.auth.profile.avatar_cancel })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.auth.profile.avatar_cancel }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:avatar");
    await user.upload(input, new File(["png"], "avatar.png", { type: "image/png" }));
    failUpload = true;
    await user.click(screen.getByRole("button", { name: en.auth.profile.save }));
    expect(await screen.findByText(en.auth.profile.avatar_upload_failed)).toBeInTheDocument();
    failUpload = false;
    await user.click(screen.getByRole("button", { name: en.auth.profile.save }));
    expect(updates.at(-1)?.avatar).toBe("signed");

    await user.click(await screen.findByRole("button", { name: en.auth.profile.edit }));
    failRemove = true;
    await user.click(screen.getByRole("button", { name: en.auth.profile.avatar_remove }));
    expect(await screen.findByText(en.auth.profile.avatar_remove_failed)).toBeInTheDocument();
    failRemove = false;
    await user.click(screen.getByRole("button", { name: en.auth.profile.avatar_remove }));
    await waitFor(() => expect(updates.at(-1)?.avatar).toBeNull());
    expect(screen.queryByRole("button", { name: en.auth.profile.avatar_remove })).toBeNull();
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
    render(wrap(<SelfProfilePane />));
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
    render(wrap(<SelfProfilePane />));
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

  it("shares the public profile link through the QR overlay", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(wrap(<SelfProfilePane />));

    await user.click(await screen.findByRole("button", { name: en.auth.profile.share }));
    expect(await screen.findByRole("img", { name: en.qr.image })).toBeInTheDocument();
    expect(document.querySelector("[data-qr-code]")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: en.qr.copy }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(`${globalThis.location.origin}/u/ada`);
    });
  });

  it("hides the admin action from non-admin sessions", async () => {
    render(wrap(<SelfProfilePane />));
    expect(await screen.findByRole("button", { name: en.auth.profile.edit })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: en.admin.title })).toBeNull();
    expect(screen.queryByRole("button", { name: en.admin.title })).toBeNull();
  });

  it("links admins to the admin shell from the profile header", async () => {
    server.use(
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
            is_admin: true,
            onboarded: true,
            phone: null,
            phone_verified: false,
          },
        }),
      ),
    );
    const user = userEvent.setup();
    render(
      <AppProviders>
        <MemoryRouter>
          <Routes>
            <Route element={<SelfProfilePane />} path="/" />
            <Route element={<p>{ADMIN_SHELL_STUB}</p>} path="/admin" />
          </Routes>
        </MemoryRouter>
      </AppProviders>,
    );
    const link = await screen.findByRole("link", { name: en.admin.title });
    expect(link).toHaveAttribute("href", "/admin");

    await user.click(link);
    expect(await screen.findByText(ADMIN_SHELL_STUB)).toBeInTheDocument();
  });
});
