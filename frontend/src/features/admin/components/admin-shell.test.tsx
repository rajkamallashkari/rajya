import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { AdminAuditPanel } from "./admin-audit-panel";
import { AdminBotsPanel } from "./admin-bots-panel";
import { AdminConfigPanel } from "./admin-config-panel";
import { AdminDashboardPanel } from "./admin-dashboard-panel";
import { AdminPromptsPanel } from "./admin-prompts-panel";
import { AdminShell } from "./admin-shell";
import { AdminTranscriptPanel } from "./admin-transcript-panel";
import { AdminUserDetailPanel } from "./admin-user-detail-panel";
import { AdminUsersPanel } from "./admin-users-panel";
import { setAccessSession } from "@/features/auth/model/access-session";
import { ACCOUNTS_STORAGE_KEY } from "@/features/auth/model/account-token";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { useShellStore } from "@/features/settings/store/shell-store";
import { en } from "@/shared/lib/i18n/catalog";
import { testSession } from "@/test/access-session";
import { server } from "@/test/msw";

const adminMe = {
  account: { id: 1, username: "ada", display_name: "Ada", kind: "human" },
  user: {
    id: 1,
    email: "ada@example.com",
    onboarded: true,
    has_password: true,
    has_passkey: false,
    phone_verified: false,
    is_admin: true,
  },
};

function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminShell />} path="/admin">
        <Route element={<AdminDashboardPanel />} index />
        <Route element={<AdminUsersPanel />} path="users" />
        <Route element={<AdminUserDetailPanel />} path="users/:userId" />
        <Route element={<AdminTranscriptPanel />} path="conversations/:conversationId" />
        <Route element={<AdminBotsPanel />} path="bots" />
        <Route element={<AdminAuditPanel />} path="audit" />
        <Route element={<AdminConfigPanel />} path="config" />
        <Route element={<AdminPromptsPanel />} path="prompts" />
      </Route>
    </Routes>
  );
}

function renderAdmin(path: string) {
  setAccessSession(testSession({ token: "admin-token" }));
  server.use(http.all("*/api/v1/users/me", () => HttpResponse.json(adminMe)));
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <AdminRoutes />
      </MemoryRouter>
    </AppProviders>,
  );
}

describe("AdminShell", () => {
  it("opens users from a stored admin token", async () => {
    window.localStorage.setItem(
      ACCOUNTS_STORAGE_KEY,
      JSON.stringify({
        accounts: [
          {
            displayName: "Ada",
            hasPasskey: false,
            hasPassword: true,
            id: 1,
            onboarded: true,
            token: "admin-token",
            username: "ada",
          },
        ],
        activeAccountId: 1,
      }),
    );
    useAccountsStore.getState().hydrate();
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/admin/users"]}>
          <AdminRoutes />
        </MemoryRouter>
      </AppProviders>,
    );
    expect(await screen.findByText("Peer")).toBeInTheDocument();
  });

  it("forbids non-admins", async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/admin"]}>
          <AdminRoutes />
        </MemoryRouter>
      </AppProviders>,
    );
    expect(await screen.findByText(en.admin.forbidden)).toBeInTheDocument();
  });

  it("retries when identity fails to load", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    server.use(http.all("*/api/v1/users/me", () => HttpResponse.json({}, { status: 500 })));
    render(
      <AppProviders>
        <MemoryRouter initialEntries={["/admin"]}>
          <AdminRoutes />
        </MemoryRouter>
      </AppProviders>,
    );
    await user.click(await screen.findByRole("button", { name: en.lists.error_retry }));
    expect(await screen.findByRole("button", { name: en.lists.error_retry })).toBeInTheDocument();
  });

  it("shows the admin chip, dashboard, and configuration editors", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderAdmin("/admin");
    expect(await screen.findByText(/r2/)).toBeInTheDocument();
    expect(document.querySelector("[data-admin-chip]")).not.toBeNull();
    expect(screen.getByText(/storage_bytes/)).toBeInTheDocument();
    expect(screen.getByText(/nested/)).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: en.admin.settings }));
    expect(await screen.findByRole("textbox", { name: "message_edit_window" })).toBeInTheDocument();
  });

  it("searches users, impersonates, and opens a transcript", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderAdmin("/admin/users");
    expect(await screen.findByText("Peer")).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByText(/user3/)).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: en.admin.search_users }), "zzz");
    await waitFor(() => {
      expect(screen.queryByText("Peer")).toBeNull();
    });
    await user.clear(screen.getByRole("textbox", { name: en.admin.search_users }));
    await user.click(await screen.findByRole("link", { name: /Peer/ }));
    await user.click(await screen.findByRole("button", { name: en.admin.impersonate }));
    await waitFor(() => {
      expect(useShellStore.getState().impersonatingName).toBe("Peer");
    });
  });

  it("approves and declines bot requests, filters audit, and saves a prompt", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderAdmin("/admin/bots");
    expect(await screen.findByText(en.admin.request_edit)).toBeInTheDocument();
    expect(screen.getByText("nimbus")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: en.admin.approve })[0]!);
    await user.click(screen.getAllByRole("button", { name: en.admin.decline })[0]!);
    await user.click(screen.getByRole("link", { name: en.admin.audit }));
    expect(await screen.findByText("impersonation.start")).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: en.admin.action }), "transcript.read");
    await waitFor(() => {
      expect(screen.queryByText("impersonation.start")).toBeNull();
    });
    await user.click(screen.getByRole("link", { name: en.admin.prompts }));
    expect(await screen.findByText(/Version 0/)).toBeInTheDocument();
    const field = await screen.findByRole("textbox", { name: "bot_reply" });
    await user.clear(field);
    await user.type(field, "Be brief.");
    await user.click(screen.getAllByRole("button", { name: en.admin.current })[0]!);
    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "bot_reply" })).toBeInTheDocument();
    });
  });

  it("exits impersonation from the admin banner", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    useShellStore.setState({ impersonatingName: "Peer" });
    renderAdmin("/admin");
    expect(await screen.findByRole("alert")).toHaveTextContent("Peer");
    await user.click(screen.getByRole("button", { name: en.impersonation.exit }));
    await waitFor(() => {
      expect(useShellStore.getState().impersonatingName).toBeNull();
    });
  });

  it("opens a transcript from a user conversation", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderAdmin("/admin/users/2");
    await screen.findByRole("button", { name: en.admin.impersonate });
    const conversation = screen
      .getAllByRole("link")
      .find((link) => (link.getAttribute("href") ?? "").startsWith("/admin/conversations/"));
    expect(conversation).toBeTruthy();
    await user.click(conversation!);
    expect(await screen.findByText(en.admin.transcript)).toBeInTheDocument();
  });

  it("retries an error list", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    server.use(
      http.get("*/api/v1/admin/dashboard", () => HttpResponse.json({}, { status: 500 })),
      http.get("*/api/v1/admin/users", () => HttpResponse.json({}, { status: 500 })),
      http.get("*/api/v1/admin/bot_requests", () => HttpResponse.json({}, { status: 500 })),
      http.get("*/api/v1/admin/audit_events", () => HttpResponse.json({}, { status: 500 })),
      http.get("*/api/v1/admin/prompt_templates", () => HttpResponse.json({}, { status: 500 })),
    );
    renderAdmin("/admin");
    await user.click(await screen.findByRole("button", { name: en.lists.error_retry }));
    await user.click(screen.getByRole("link", { name: en.admin.users }));
    await user.click(await screen.findByRole("button", { name: en.lists.error_retry }));
    await user.click(screen.getByRole("link", { name: en.admin.bots }));
    await user.click(await screen.findByRole("button", { name: en.lists.error_retry }));
    await user.click(screen.getByRole("link", { name: en.admin.audit }));
    await user.click(await screen.findByRole("button", { name: en.lists.error_retry }));
    await user.click(screen.getByRole("link", { name: en.admin.prompts }));
    await user.click(await screen.findByRole("button", { name: en.lists.error_retry }));
  });

  it("retries transcript and user detail errors", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    server.use(
      http.get("*/api/v1/admin/conversations/:conversation_id/messages", () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );
    renderAdmin("/admin/conversations/1");
    await user.click(await screen.findByRole("button", { name: en.lists.error_retry }));
  });

  it("shows the admin badge without phone verification", async () => {
    renderAdmin("/admin/users/1");
    expect(await screen.findByRole("button", { name: en.admin.impersonate })).toBeInTheDocument();
    const detail = document.querySelector("[data-admin-user]");
    expect(detail?.textContent).toContain(en.admin.title);
    expect(detail?.textContent).not.toContain(en.admin.phone_verified);
  });

  it("falls back to username when a user has no email", async () => {
    renderAdmin("/admin/users/3");
    expect(await screen.findByText(/user3/)).toBeInTheDocument();
  });

  it("retries a user detail error", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    server.use(http.get("*/api/v1/admin/users/:id", () => HttpResponse.json({}, { status: 500 })));
    renderAdmin("/admin/users/2");
    await user.click(await screen.findByRole("button", { name: en.lists.error_retry }));
  });
});
