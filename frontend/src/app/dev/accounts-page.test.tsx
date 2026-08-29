import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AccountsDevPage } from "./accounts-page";
import { AppProviders } from "@/app/providers";
import { en } from "@/shared/lib/i18n/catalog";

describe("AccountsDevPage", () => {
  it("isolates outbox records by active account", async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <AccountsDevPage />
      </AppProviders>,
    );
    await user.click(screen.getByRole("button", { name: en.auth.accounts.queue }));
    expect(screen.getByText(en.auth.accounts.outbox_empty)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.auth.accounts.seed_a }));
    await user.click(screen.getByRole("button", { name: en.auth.accounts.queue }));
    expect(document.querySelector("[data-outbox-count]")?.getAttribute("data-outbox-count")).toBe(
      "1",
    );
    await user.click(screen.getByRole("button", { name: en.auth.accounts.seed_b }));
    expect(document.querySelector("[data-outbox-count]")?.getAttribute("data-outbox-count")).toBe(
      "0",
    );
    await user.click(
      screen.getByRole("button", {
        name: en.auth.accounts.switch.replace("{{name}}", en.auth.accounts.seed_a),
      }),
    );
    expect(document.querySelector("[data-outbox-count]")?.getAttribute("data-outbox-count")).toBe(
      "1",
    );
  });
});
