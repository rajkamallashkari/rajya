import { type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { SelfProfilePane } from "@/features/auth/components/self-profile-pane";
import { persistSession } from "@/features/auth/model/persist-session";
import { setAccessSession } from "@/features/auth/model/access-session";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { SettingsPanel } from "@/features/settings/components/settings-panel";
import { resetShellStore, useShellStore } from "@/features/settings/store/shell-store";
import { seedPreferenceOverlay } from "@/shared/lib/api/msw/handlers";
import { en } from "@/shared/lib/i18n/catalog";
import { resetLayerStore, useLayerStore } from "@/shared/lib/navigation/layer-store";
import { testSession } from "@/test/access-session";
import { server } from "@/test/msw";

function wrap(ui: ReactNode) {
  return (
    <AppProviders>
      <MemoryRouter>{ui}</MemoryRouter>
    </AppProviders>
  );
}

function seedAccount(): void {
  setAccessSession(testSession());
  persistSession({
    account: { display_name: "Ada", id: 1, username: "ada" },
    token: "tok",
    user: { has_passkey: false, has_password: true, onboarded: true },
  });
}

describe("settings hub stack", () => {
  beforeEach(() => {
    resetLayerStore();
    resetShellStore();
    seedAccount();
  });

  it("opens hub rows and hides profile email until the privacy toggle is on", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      wrap(
        <>
          <SelfProfilePane />
          <SettingsPanel />
        </>,
      ),
    );

    expect(
      await screen.findByRole("button", { name: en.settings.notifications }),
    ).toBeInTheDocument();
    expect(screen.queryByText("ada@example.com")).toBeNull();

    await user.click(screen.getByRole("button", { name: en.settings.privacy }));
    await user.click(
      await screen.findByRole("switch", { name: en.settings.privacy_show_email_on_profile }),
    );
    expect(await screen.findByText("ada@example.com")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.shell.back }));

    await user.click(screen.getByRole("button", { name: en.settings.notifications }));
    expect(document.querySelector("[data-notifications-panel]")).not.toBeNull();
    await user.click(
      screen.getByRole("button", { name: en.settings.notifications_level_mentions }),
    );
    await user.click(screen.getByRole("switch", { name: en.settings.notifications_preview }));
    await user.click(screen.getByRole("switch", { name: en.settings.notifications_sound }));
    await user.click(screen.getByRole("switch", { name: en.settings.notifications_vibration }));
    await user.click(screen.getByRole("switch", { name: en.settings.notifications_dnd }));
    fireEvent.change(screen.getByLabelText(en.settings.notifications_dnd_start), {
      target: { value: "21:00" },
    });
    fireEvent.change(screen.getByLabelText(en.settings.notifications_dnd_end), {
      target: { value: "08:00" },
    });
    await user.click(screen.getByRole("button", { name: en.settings.dow["0"] }));
    await user.click(screen.getByRole("button", { name: en.settings.dow["0"] }));
    await user.click(screen.getByRole("button", { name: en.shell.back }));

    await user.click(screen.getByRole("button", { name: en.settings.chats }));
    expect(document.querySelector("[data-chats-panel]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.shell.back }));
    await user.click(screen.getByRole("button", { name: en.settings.devices }));
    expect(document.querySelector("[data-devices-panel]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.shell.back }));
    await user.click(screen.getByRole("button", { name: en.settings.stickers }));
    expect(document.querySelector("[data-stickers-panel]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.shell.back }));

    server.use(
      http.get("*/api/v1/passkeys", () =>
        HttpResponse.json({
          passkeys: [
            { created_at: "2026-01-01T00:00:00Z", id: 1, last_used_at: null, nickname: null },
          ],
        }),
      ),
    );
    await user.click(screen.getByRole("button", { name: en.settings.security }));
    await user.type(screen.getByLabelText(en.settings.security_current_password), "oldpass12");
    await user.type(screen.getByLabelText(en.settings.security_new_password), "newpass12");
    await user.type(screen.getByLabelText(en.settings.security_confirm_password), "newpass12");
    await user.click(screen.getByRole("button", { name: en.settings.security_save_password }));
    await user.click(screen.getByRole("button", { name: en.settings.security_add_passkey }));
    expect(await screen.findByText(en.settings.security_passkey_failed)).toBeInTheDocument();
    const nickname = screen.getByLabelText(en.settings.security_passkey_nickname);
    fireEvent.blur(nickname, { target: { value: "Laptop" } });
    fireEvent.blur(nickname, { target: { value: "   " } });
    fireEvent.blur(nickname, { target: { value: "Key" } });
    await user.click(screen.getByRole("button", { name: en.settings.security_delete_passkey }));
    await user.click(screen.getByRole("button", { name: en.shell.back }));

    await user.click(screen.getByRole("button", { name: en.settings.display }));
    expect(document.querySelector("[data-locale-panel]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.settings.locale_time_24h }));
    await user.click(screen.getByRole("combobox", { name: en.settings.locale_date }));
    await user.click(await screen.findByRole("option", { name: "YYYY-MM-DD" }));
    const timezone = screen.getByLabelText(en.settings.locale_timezone);
    await user.clear(timezone);
    await user.type(timezone, "America/New_York");
    await user.click(screen.getByRole("button", { name: en.shell.back }));

    await user.click(screen.getByRole("button", { name: en.settings.ai }));
    expect(document.querySelector("[data-ai-panel]")).not.toBeNull();
    await user.click(screen.getByRole("combobox", { name: en.settings.translation_language }));
    await user.click(await screen.findByRole("option", { name: "es" }));
    await user.click(screen.getByRole("button", { name: en.shell.back }));

    await user.click(screen.getByRole("button", { name: en.settings.starred }));
    expect(document.querySelector("[data-starred-panel]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.settings.starred_unsave }));
    await user.click(screen.getByRole("button", { name: en.shell.back }));

    await user.click(screen.getByRole("button", { name: en.settings.scheduled }));
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: en.settings.scheduled_send_now }));
    await user.click(screen.getByRole("button", { name: en.settings.scheduled_cancel }));
    await user.click(screen.getByRole("button", { name: en.shell.back }));

    await user.click(screen.getByRole("button", { name: en.settings.bots }));
    expect(await screen.findByRole("textbox", { name: en.bots.name })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.shell.back }));

    useAccountsStore.getState().upsertAccount({
      displayName: "Bob",
      hasPasskey: false,
      hasPassword: true,
      id: 2,
      onboarded: true,
      token: "tok-2",
      username: "bob",
    });
    await user.click(screen.getByRole("button", { name: en.settings.accounts }));
    await user.click(screen.getByRole("button", { name: /Bob.*@bob/ }));
    await waitFor(() => {
      expect(useAccountsStore.getState().activeAccountId).toBe(2);
    });
    await user.click(screen.getByRole("button", { name: en.auth.accounts.logout_all }));
    expect(useAccountsStore.getState().accounts).toEqual([]);
  });

  it("jumps from a starred row and covers extra notification scopes", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    seedPreferenceOverlay({
      notifications: {
        global: {
          dnd_days: [0, 1, 2, 3, 4, 5, 6],
          dnd_enabled: true,
          dnd_end: "07:00",
          dnd_start: "22:00",
          level: "all",
          show_preview: true,
          sound: true,
          vibration: true,
        },
        "3": {
          dnd_days: [],
          dnd_enabled: false,
          dnd_end: "07:00",
          dnd_start: "22:00",
          level: "none",
          show_preview: false,
          sound: false,
          vibration: false,
        },
      },
    });
    render(wrap(<SettingsPanel />));
    await user.click(screen.getByRole("button", { name: en.settings.notifications }));
    expect(
      await screen.findByText(en.settings.notifications_chat.replace("{{id}}", "3")),
    ).toBeInTheDocument();
    await user.click(
      screen.getAllByRole("button", { name: en.settings.notifications_level_none })[1]!,
    );
    await user.click(
      screen.getAllByRole("switch", { name: en.settings.notifications_preview })[1]!,
    );
    await user.click(screen.getAllByRole("switch", { name: en.settings.notifications_sound })[1]!);
    await user.click(
      screen.getAllByRole("switch", { name: en.settings.notifications_vibration })[1]!,
    );
    await user.click(screen.getAllByRole("switch", { name: en.settings.notifications_dnd })[1]!);
    await waitFor(() => {
      expect(screen.getAllByLabelText(en.settings.notifications_dnd_start)[1]).not.toBeDisabled();
    });
    fireEvent.change(screen.getAllByLabelText(en.settings.notifications_dnd_start)[1]!, {
      target: { value: "21:00" },
    });
    fireEvent.change(screen.getAllByLabelText(en.settings.notifications_dnd_end)[1]!, {
      target: { value: "08:00" },
    });
    await user.click(screen.getAllByRole("button", { name: en.settings.dow["0"] })[1]!);
    await user.click(screen.getByRole("button", { name: en.shell.back }));
    await user.click(screen.getByRole("button", { name: en.settings.starred }));
    await user.click(await screen.findByRole("button", { name: "Are you free later?" }));
    expect(useLayerStore.getState().layers[0]?.kind).toBe("conversation");
    expect(useShellStore.getState().destination).toBe("chats");
  });

  it("retries failed lists and cancelled passkey prompts", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    server.use(
      http.get("*/api/v1/scheduled_messages", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
      http.get("*/api/v1/blocks", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
      http.get("*/api/v1/passkeys", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
      http.patch("*/api/v1/users/me/password", () =>
        HttpResponse.json(
          { error: { code: "fail", message: "fail", details: {} } },
          { status: 500 },
        ),
      ),
      http.post("*/api/v1/passkeys/registration_options", () =>
        HttpResponse.json({
          challenge: "YQ",
          rp: { id: "localhost", name: "Rajya" },
          user: { displayName: "Ada", id: "YQ", name: "ada" },
        }),
      ),
    );
    Object.defineProperty(navigator, "credentials", {
      configurable: true,
      value: { create: vi.fn().mockResolvedValue(null) },
    });
    render(wrap(<SettingsPanel />));
    await user.click(screen.getByRole("button", { name: en.settings.scheduled }));
    expect(await screen.findByText(en.lists.error_title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.lists.error_retry }));
    await user.click(screen.getByRole("button", { name: en.shell.back }));
    await user.click(screen.getByRole("button", { name: en.settings.privacy }));
    expect(await screen.findByText(en.lists.error_title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.lists.error_retry }));
    await user.click(screen.getByRole("button", { name: en.shell.back }));
    await user.click(screen.getByRole("button", { name: en.settings.security }));
    expect(await screen.findByText(en.lists.error_title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.lists.error_retry }));
    await user.click(screen.getByRole("button", { name: en.settings.security_save_password }));
    expect(await screen.findByText(en.settings.security_password_failed)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.settings.security_add_passkey }));
    expect(screen.queryByText(en.settings.security_passkey_failed)).toBeNull();
  });

  it("shows scheduled rows without a matching chat", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    server.use(
      http.get("*/api/v1/scheduled_messages", () =>
        HttpResponse.json({
          scheduled_messages: [
            {
              body: "orphan",
              conversation_id: 999,
              created_at: "2026-01-01T12:00:00.000Z",
              id: 8,
              occurrences_sent: 0,
              scheduled_at: "2026-01-01T12:00:00.000Z",
            },
          ],
        }),
      ),
    );
    render(wrap(<SettingsPanel />));
    await user.click(screen.getByRole("button", { name: en.settings.scheduled }));
    expect(await screen.findByText("orphan")).toBeInTheDocument();
    expect(screen.getAllByText(en.settings.scheduled).length).toBeGreaterThan(0);
  });

  it("retries starred errors, empty bodies, and password without a current secret", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    let failSaved = true;
    server.use(
      http.get("*/api/v1/users/me", () =>
        HttpResponse.json({
          account: { display_name: "Ada", id: 1, kind: "human", username: "ada" },
          user: {
            email: "ada@example.com",
            has_passkey: false,
            has_password: false,
            id: 1,
            is_admin: false,
            onboarded: true,
            phone: null,
            phone_verified: false,
          },
        }),
      ),
      http.get("*/api/v1/saved_messages", () => {
        if (failSaved) {
          return HttpResponse.json(
            { error: { code: "fail", message: "fail", details: {} } },
            { status: 500 },
          );
        }
        return HttpResponse.json({
          saved_messages: [
            {
              created_at: "2026-01-01T12:00:00.000Z",
              id: 9,
              message: {
                body: "   ",
                conversation_id: 1,
                created_at: "2026-01-01T12:00:00.000Z",
                deleted: false,
                id: 9,
                kind: "text",
                position: 1,
                revision: 1,
                silent: false,
              },
              message_id: 9,
            },
          ],
        });
      }),
    );
    render(wrap(<SettingsPanel />));
    await user.click(screen.getByRole("button", { name: en.settings.starred }));
    expect(await screen.findByText(en.lists.error_title)).toBeInTheDocument();
    failSaved = false;
    await user.click(screen.getByRole("button", { name: en.lists.error_retry }));
    expect(await screen.findByRole("button", { name: en.settings.starred })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.shell.back }));
    await user.click(screen.getByRole("button", { name: en.settings.security }));
    expect(screen.queryByLabelText(en.settings.security_current_password)).toBeNull();
    await user.type(screen.getByLabelText(en.settings.security_new_password), "newpass12");
    await user.type(screen.getByLabelText(en.settings.security_confirm_password), "newpass12");
    await user.click(screen.getByRole("button", { name: en.settings.security_save_password }));
    await waitFor(() => {
      expect(screen.getByLabelText(en.settings.security_new_password)).toHaveValue("");
    });
  });

  it("unblocks a person and registers a passkey", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    server.use(
      http.get("*/api/v1/blocks", () =>
        HttpResponse.json({
          blocks: [{ account: { display_name: "Eve", id: 9, kind: "human", username: "eve" } }],
        }),
      ),
      http.post("*/api/v1/passkeys/registration_options", () =>
        HttpResponse.json({
          challenge: "YQ",
          rp: { id: "localhost", name: "Rajya" },
          user: { displayName: "Ada", id: "YQ", name: "ada" },
        }),
      ),
    );
    const bytes = new TextEncoder().encode("raw");
    Object.defineProperty(navigator, "credentials", {
      configurable: true,
      value: {
        create: vi.fn().mockResolvedValue({
          id: "att",
          rawId: bytes.buffer,
          response: {
            attestationObject: bytes.buffer,
            clientDataJSON: bytes.buffer,
          },
          type: "public-key",
        }),
      },
    });
    render(wrap(<SettingsPanel />));
    await user.click(screen.getByRole("button", { name: en.settings.privacy }));
    await user.click(await screen.findByRole("button", { name: "Eve" }));
    expect(useLayerStore.getState().layers).toContainEqual(
      expect.objectContaining({ accountId: "9", kind: "profile" }),
    );
    await user.click(await screen.findByRole("button", { name: en.settings.privacy_unblock }));
    await user.click(screen.getByRole("button", { name: en.shell.back }));
    await user.click(screen.getByRole("button", { name: en.settings.security }));
    await user.click(screen.getByRole("button", { name: en.settings.security_add_passkey }));
    await waitFor(() => {
      expect(navigator.credentials.create).toHaveBeenCalled();
    });
  });
});
