import { MemoryRouter, Route, Routes } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { AdminReportDetailPanel, AdminReportsPanel } from "./admin-reports-panel";
import { setAccessSession } from "@/features/auth/model/access-session";
import { en } from "@/shared/lib/i18n/catalog";
import { server } from "@/test/msw";
import { testSession } from "@/test/access-session";

function renderAt(path: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AdminReportsPanel />} path="/admin/reports" />
          <Route element={<AdminReportDetailPanel />} path="/admin/reports/:reportId" />
          <Route element={<p>transcript</p>} path="/admin/conversations/:conversationId" />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}

describe("AdminReportsPanel", () => {
  it("filters the queue and opens a report", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    renderAt("/admin/reports");
    expect(await screen.findByText("Peer")).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: en.admin.status }));
    await user.click(await screen.findByRole("option", { name: en.admin.status_reviewing }));
    await waitFor(() => {
      expect(screen.queryByText("Peer")).toBeNull();
    });
    await user.click(screen.getByRole("combobox", { name: en.admin.status }));
    await user.click(await screen.findByRole("option", { name: en.admin.age_all }));
    expect(await screen.findByText("Peer")).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: en.admin.subject_type }));
    await user.click(await screen.findByRole("option", { name: en.admin.subject_bot }));
    await waitFor(() => {
      expect(screen.queryByText("Peer")).toBeNull();
    });
    await user.click(screen.getByRole("combobox", { name: en.admin.subject_type }));
    await user.click(await screen.findByRole("option", { name: en.admin.age_all }));
    expect(await screen.findByText("Peer")).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: en.admin.age }));
    await user.click(await screen.findByRole("option", { name: en.admin.age_day }));
    expect(await screen.findByText("Peer")).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: en.admin.age }));
    await user.click(await screen.findByRole("option", { name: en.admin.age_week }));
    expect(await screen.findByText("Peer")).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: en.admin.age }));
    await user.click(await screen.findByRole("option", { name: en.admin.age_month }));
    expect(await screen.findByText("Peer")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /Peer/ }));
    expect(await screen.findByText("spam text")).toBeInTheDocument();
  });

  it("retries after a list error", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    let fail = true;
    server.use(
      http.get("*/api/v1/admin/reports", () => {
        if (fail) {
          return HttpResponse.json({}, { status: 500 });
        }
        return HttpResponse.json({ reports: [] });
      }),
    );
    setAccessSession(testSession());
    renderAt("/admin/reports");
    expect(await screen.findByText(en.lists.error_title)).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole("button", { name: en.lists.error_retry }));
    expect(await screen.findByText(en.lists.empty_title)).toBeInTheDocument();
  });
});

describe("AdminReportDetailPanel", () => {
  it("triages a message report", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    setAccessSession(testSession());
    renderAt("/admin/reports/1");
    expect(await screen.findByText("spam text")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.admin.warn }));
    await user.type(screen.getByRole("textbox", { name: en.admin.note }), "done");
    await user.click(screen.getByRole("button", { name: en.admin.dismiss }));
    await user.click(screen.getByRole("button", { name: en.admin.warn }));
    await user.click(screen.getByRole("button", { name: en.admin.remove_content }));
    await user.click(screen.getByRole("button", { name: en.admin.deactivate_account }));
    await user.click(screen.getByRole("link", { name: en.admin.transcript }));
    expect(await screen.findByText("transcript")).toBeInTheDocument();
  });

  it("hides account actions on a conversation report", async () => {
    setAccessSession(testSession());
    server.use(
      http.get("*/api/v1/admin/reports/:id", () =>
        HttpResponse.json({
          created_at: "2026-01-01T12:00:00.000Z",
          id: 2,
          reason: "spam",
          reporter: { id: 2, username: "peer", display_name: "Peer", kind: "human" },
          status: "pending",
          subject: {
            conversation_id: 1,
            id: 1,
            label: "Group",
            type: "conversation",
          },
          subject_id: 1,
          subject_type: "conversation",
        }),
      ),
    );
    renderAt("/admin/reports/2");
    expect(await screen.findByText("Group")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.admin.remove_content })).toBeNull();
    expect(screen.queryByRole("button", { name: en.admin.deactivate_account })).toBeNull();
  });

  it("retries after a detail error", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    let fail = true;
    server.use(
      http.get("*/api/v1/admin/reports/:id", () => {
        if (fail) {
          return HttpResponse.json({}, { status: 500 });
        }
        return HttpResponse.json({
          created_at: "2026-01-01T12:00:00.000Z",
          id: 1,
          reason: "spam",
          reporter: { id: 2, username: "peer", display_name: "Peer", kind: "human" },
          status: "pending",
          subject: { account_id: 2, id: 2, label: "Peer", type: "account" },
          subject_id: 2,
          subject_type: "account",
        });
      }),
    );
    setAccessSession(testSession());
    renderAt("/admin/reports/1");
    expect(await screen.findByText(en.lists.error_title)).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole("button", { name: en.lists.error_retry }));
    expect(await screen.findByText("Peer")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.admin.remove_content })).toBeNull();
    expect(screen.getByRole("button", { name: en.admin.deactivate_account })).toBeInTheDocument();
  });
});
