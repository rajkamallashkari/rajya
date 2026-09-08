import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { CallsDestination } from "./calls-destination";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { resetShellStore, useShellStore } from "@/features/settings/store/shell-store";
import { en } from "@/shared/lib/i18n/catalog";
import { MESSAGE_STAMP, VIEWER, peerAccount } from "@/shared/lib/api/msw/messaging-store";
import { server } from "@/test/msw";

const emptyLog = {
  calls: [],
  meta: { page: 1, per_page: 50, total: 0, has_more: false },
};

describe("CallsDestination", () => {
  afterEach(() => {
    resetShellStore();
  });

  it("opens a peer profile, not the self profile pane", async () => {
    const user = userEvent.setup();
    useAccountsStore.setState({ activeAccountId: VIEWER.id });
    render(
      <AppProviders>
        <CallsDestination />
      </AppProviders>,
    );
    expect(await screen.findByRole("region", { name: en.shell.calls })).toBeInTheDocument();
    expect(document.querySelector("[data-call-overlays]")).toBeNull();
    await user.click(await screen.findByRole("button", { name: /Grace/ }));
    expect(document.querySelector("[data-profile-pane]")).toBeNull();
    expect(document.querySelector("[data-account-profile]")).not.toBeNull();
    expect(useShellStore.getState().callsContact?.accountId).toBe("2");
    await user.click(screen.getByRole("button", { name: en.shell.back }));
    expect(useShellStore.getState().callsContact).toBeNull();
  });

  it("opens a group conversation profile from a group row", async () => {
    const user = userEvent.setup();
    useAccountsStore.setState({ activeAccountId: VIEWER.id });
    render(
      <AppProviders>
        <CallsDestination />
      </AppProviders>,
    );
    await user.click(await screen.findByRole("button", { name: /Team/ }));
    expect(useShellStore.getState().callsContact).toEqual({ conversationId: "2" });
    await waitFor(() => {
      expect(document.querySelector("[data-profile-panel]")).not.toBeNull();
    });
  });

  it("shows an empty log, retries errors, and pages", async () => {
    const user = userEvent.setup();
    server.use(http.get("*/api/v1/calls", () => HttpResponse.json(emptyLog)));
    useAccountsStore.setState({ activeAccountId: VIEWER.id });
    const emptyView = render(
      <AppProviders>
        <CallsDestination />
      </AppProviders>,
    );
    expect(await screen.findByText(en.calls.empty)).toBeInTheDocument();
    emptyView.unmount();

    server.use(
      http.get("*/api/v1/calls", () =>
        HttpResponse.json({ error: { code: "upstream_failed" } }, { status: 502 }),
      ),
    );
    const errorView = render(
      <AppProviders>
        <CallsDestination />
      </AppProviders>,
    );
    expect(await screen.findByText(en.lists.error_title)).toBeInTheDocument();
    server.use(http.get("*/api/v1/calls", () => HttpResponse.json(emptyLog)));
    await user.click(screen.getByRole("button", { name: en.lists.error_retry }));
    expect(await screen.findByText(en.calls.empty)).toBeInTheDocument();
    errorView.unmount();

    const grace = peerAccount(2, "Grace");
    server.use(
      http.get("*/api/v1/calls", ({ request }) => {
        const page = new URL(request.url).searchParams.get("page");
        if (page === "2") {
          return HttpResponse.json({
            calls: [
              {
                id: 13,
                conversation_id: 1,
                conversation_kind: "direct",
                initiator_account_id: VIEWER.id,
                kind: "audio",
                status: "ended",
                created_at: MESSAGE_STAMP,
                title: "Second",
                peer: grace,
                participants: [],
              },
            ],
            meta: { page: 2, per_page: 1, total: 2, has_more: false },
          });
        }
        return HttpResponse.json({
          calls: [
            {
              id: 11,
              conversation_id: 1,
              conversation_kind: "direct",
              initiator_account_id: VIEWER.id,
              kind: "audio",
              status: "ended",
              created_at: MESSAGE_STAMP,
              title: grace.display_name,
              peer: grace,
              participants: [],
            },
          ],
          meta: { page: 1, per_page: 1, total: 2, has_more: true },
        });
      }),
    );
    render(
      <AppProviders>
        <CallsDestination />
      </AppProviders>,
    );
    await user.click(await screen.findByRole("button", { name: en.calls.load_more }));
    expect(await screen.findByRole("button", { name: /Second/ })).toBeInTheDocument();
  });
});
