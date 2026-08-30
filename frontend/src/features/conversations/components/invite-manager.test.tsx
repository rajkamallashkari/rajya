import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { InviteManager } from "./invite-manager";
import { AppProviders } from "@/app/providers";
import { createInvite } from "@/features/conversations/api/http";
import { en } from "@/shared/lib/i18n/catalog";
import { server } from "@/test/msw";

describe("InviteManager", () => {
  it("renders empty lists when there are no invites or requests", async () => {
    server.use(
      http.get("*/api/v1/conversations/:conversation_id/invites", () =>
        HttpResponse.json({ invites: [] }),
      ),
      http.get("*/api/v1/conversations/:conversation_id/join_requests", () =>
        HttpResponse.json({ join_requests: [] }),
      ),
    );
    render(
      <AppProviders>
        <InviteManager conversationId={2} />
      </AppProviders>,
    );
    expect(await screen.findByText(en.invites.empty)).toBeInTheDocument();
    expect(screen.getByText(en.invites.no_requests)).toBeInTheDocument();
  });

  it("creates, copies, shows a QR, and revokes an invite", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(
      <AppProviders>
        <InviteManager conversationId={2} />
      </AppProviders>,
    );
    expect(await screen.findByText(en.invites.unlimited)).toBeInTheDocument();
    expect(screen.getByText(en.invites.approval)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.invites.create }));
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: en.invites.revoke })).toHaveLength(3);
    });
    await user.click(screen.getAllByRole("button", { name: en.invites.copy })[0]!);
    expect(writeText).toHaveBeenCalled();
    await user.click(screen.getAllByRole("button", { name: en.invites.show_qr })[0]!);
    expect(document.querySelector("[data-qr-grid]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: en.qr.copy }));
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    await waitFor(() => {
      expect(document.querySelector("[data-qr-grid]")).toBeNull();
    });
    await user.click(screen.getAllByRole("button", { name: en.invites.revoke })[0]!);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: en.invites.revoke }).length).toBeLessThan(3);
    });
  });

  it("approves and rejects join requests", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <AppProviders>
        <InviteManager conversationId={2} />
      </AppProviders>,
    );
    expect(await screen.findByText("Joiner")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.invites.approve }));
    expect(await screen.findByText(en.invites.no_requests)).toBeInTheDocument();
  });

  it("rejects a join request", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <AppProviders>
        <InviteManager conversationId={2} />
      </AppProviders>,
    );
    expect(await screen.findByText("Joiner")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.invites.reject }));
    expect(await screen.findByText(en.invites.no_requests)).toBeInTheDocument();
  });

  it("disables create while an invite is saving", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    server.use(
      http.post("*/api/v1/conversations/:conversation_id/invites", async () => {
        await delay(80);
        return HttpResponse.json(
          {
            created_at: "2026-01-01T12:00:00.000Z",
            expires_at: null,
            id: 9,
            max_uses: null,
            requires_approval: false,
            token: "slow",
            usable: true,
            uses_count: 0,
          },
          { status: 201 },
        );
      }),
    );
    render(
      <AppProviders>
        <InviteManager conversationId={2} />
      </AppProviders>,
    );
    await screen.findByText(en.invites.manage);
    await user.click(screen.getByRole("button", { name: en.invites.create }));
    expect(screen.getByRole("button", { name: en.invites.create })).toBeDisabled();
  });

  it("creates an invite with explicit options", async () => {
    const row = await createInvite(2, { max_uses: 2, requires_approval: true });
    expect(row.requires_approval).toBe(true);
    expect(row.max_uses).toBe(2);
  });
});
