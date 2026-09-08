import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { AuthGate } from "./auth-gate";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { en } from "@/shared/lib/i18n/catalog";

const loginWithPassword = vi.fn();
const registerWithPassword = vi.fn();

vi.mock("@/features/auth/api/identity", () => ({
  loginWithPassword: (...args: unknown[]) => loginWithPassword(...args),
  registerWithPassword: (...args: unknown[]) => registerWithPassword(...args),
}));

const session = {
  token: "jwt",
  account: { id: 3, username: "ada", display_name: "Ada", kind: "human" },
  user: { id: 3, onboarded: false, has_password: true, has_passkey: false },
};

function renderGate(mode?: "login" | "register") {
  return render(
    <AppProviders>
      <AuthGate initialMode={mode} />
    </AppProviders>,
  );
}

describe("AuthGate", () => {
  beforeEach(() => {
    loginWithPassword.mockReset();
    registerWithPassword.mockReset();
  });

  it("signs in with email and password", async () => {
    const user = userEvent.setup();
    loginWithPassword.mockResolvedValue(session);
    renderGate("login");
    await user.type(screen.getByLabelText(en.auth.gate.email), "ada@example.com");
    await user.type(screen.getByLabelText(en.auth.gate.password), "password12");
    await user.click(screen.getByRole("button", { name: en.auth.gate.submit_login }));
    expect(loginWithPassword).toHaveBeenCalledWith("ada@example.com", "password12");
    expect(useAccountsStore.getState().activeAccountId).toBe(3);
  });

  it("reports a failed login", async () => {
    const user = userEvent.setup();
    loginWithPassword.mockRejectedValue(new Error("nope"));
    renderGate("login");
    await user.type(screen.getByLabelText(en.auth.gate.email), "ada@example.com");
    await user.type(screen.getByLabelText(en.auth.gate.password), "password12");
    await user.click(screen.getByRole("button", { name: en.auth.gate.submit_login }));
    expect(await screen.findByText(en.auth.gate.failed)).toBeInTheDocument();
  });

  it("creates an account after a matching password", async () => {
    const user = userEvent.setup();
    registerWithPassword.mockResolvedValue(session);
    renderGate("register");
    await user.type(screen.getByLabelText(en.auth.gate.name), "Ada");
    await user.type(screen.getByLabelText(en.auth.gate.email), "ada@example.com");
    await user.type(screen.getByLabelText(en.auth.gate.password), "password12");
    await user.type(screen.getByLabelText(en.auth.gate.password_confirm), "nope");
    await user.click(screen.getByRole("button", { name: en.auth.gate.submit_register }));
    expect(screen.getByText(en.auth.gate.password_mismatch)).toBeInTheDocument();
    await user.clear(screen.getByLabelText(en.auth.gate.password_confirm));
    await user.type(screen.getByLabelText(en.auth.gate.password_confirm), "password12");
    await user.click(screen.getByRole("button", { name: en.auth.gate.submit_register }));
    expect(registerWithPassword).toHaveBeenCalledWith({
      email: "ada@example.com",
      name: "Ada",
      password: "password12",
      password_confirmation: "password12",
    });
  });

  it("toggles mode and reports a failed register", async () => {
    const user = userEvent.setup();
    registerWithPassword.mockRejectedValue(new Error("nope"));
    renderGate();
    expect(screen.getByRole("button", { name: en.auth.gate.submit_register })).toBeInTheDocument();
    await user.type(screen.getByLabelText(en.auth.gate.name), "Ada");
    await user.type(screen.getByLabelText(en.auth.gate.email), "ada@example.com");
    await user.type(screen.getByLabelText(en.auth.gate.password), "password12");
    await user.type(screen.getByLabelText(en.auth.gate.password_confirm), "password12");
    await user.click(screen.getByRole("button", { name: en.auth.gate.submit_register }));
    expect(await screen.findByText(en.auth.gate.register_failed)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.auth.gate.switch_login }));
    expect(screen.getByRole("button", { name: en.auth.gate.submit_login })).toBeInTheDocument();
  });
});
