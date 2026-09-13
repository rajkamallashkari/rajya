import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { persistSession } from "@/features/auth/model/persist-session";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { en } from "@/shared/lib/i18n/catalog";
import { server } from "@/test/msw";
import { AccountsPanel } from "./accounts-panel";

describe("AccountsPanel", () => {
  it("adds an account without replacing the active session", async () => {
    const user = userEvent.setup();
    persistSession({
      account: { display_name: "Ada", id: 1, username: "ada" },
      token: "existing-token",
      user: { has_passkey: false, has_password: true, onboarded: true },
    });
    server.use(
      http.post("*/auth/login", () =>
        HttpResponse.json({
          account: { display_name: "Grace", id: 2, username: "grace" },
          token: "new-token",
          user: { has_passkey: false, has_password: true, onboarded: true },
        }),
      ),
    );
    render(
      <MemoryRouter>
        <AppProviders>
          <AccountsPanel />
        </AppProviders>
      </MemoryRouter>,
    );

    const add = screen.getByRole("button", { name: en.auth.accounts.add });
    const logout = screen.getByRole("button", { name: en.auth.accounts.logout_all });
    expect(add.compareDocumentPosition(logout) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await user.click(add);
    await user.click(screen.getByRole("button", { name: en.auth.accounts.add_cancel }));
    expect(screen.queryByRole("dialog", { name: en.auth.gate.aria })).toBeNull();
    await user.click(add);
    await user.type(screen.getByLabelText(en.auth.gate.email), "grace@example.com");
    await user.type(screen.getByLabelText(en.auth.gate.password), "password12");
    await user.click(screen.getByRole("button", { name: en.auth.gate.submit_login }));

    expect(useAccountsStore.getState().activeAccountId).toBe(1);
    expect(useAccountsStore.getState().accounts.map((account) => account.id)).toEqual([1, 2]);
    expect(screen.queryByRole("dialog", { name: en.auth.gate.aria })).toBeNull();
  });
});
