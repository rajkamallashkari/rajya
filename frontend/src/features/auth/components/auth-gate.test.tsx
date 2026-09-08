import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { AuthGate, resetConsumedMagicTokens } from "./auth-gate";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { en } from "@/shared/lib/i18n/catalog";

const loginWithPassword = vi.fn();
const registerWithPassword = vi.fn();
const loginWithGoogle = vi.fn();
const requestOtp = vi.fn();
const verifyOtp = vi.fn();
const requestMagicLink = vi.fn();
const verifyMagicLink = vi.fn();
const requestGoogleAuthCode = vi.fn();
const fetchAuthenticationOptions = vi.fn();
const authenticatePasskey = vi.fn();

vi.mock("@/features/auth/api/identity", () => ({
  loginWithPassword: (...args: unknown[]) => loginWithPassword(...args),
  registerWithPassword: (...args: unknown[]) => registerWithPassword(...args),
  loginWithGoogle: (...args: unknown[]) => loginWithGoogle(...args),
  requestOtp: (...args: unknown[]) => requestOtp(...args),
  verifyOtp: (...args: unknown[]) => verifyOtp(...args),
  requestMagicLink: (...args: unknown[]) => requestMagicLink(...args),
  verifyMagicLink: (...args: unknown[]) => verifyMagicLink(...args),
}));

vi.mock("@/features/auth/api/passkeys", () => ({
  fetchAuthenticationOptions: (...args: unknown[]) => fetchAuthenticationOptions(...args),
  authenticatePasskey: (...args: unknown[]) => authenticatePasskey(...args),
}));

vi.mock("@/features/auth/lib/gis", () => ({
  requestGoogleAuthCode: (...args: unknown[]) => requestGoogleAuthCode(...args),
}));

const session = {
  token: "jwt",
  account: { id: 3, username: "ada", display_name: "Ada", kind: "human" },
  user: { id: 3, onboarded: false, has_password: true, has_passkey: false },
};

function renderGate(mode?: "login" | "register", entry = "/") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AppProviders>
        <AuthGate initialMode={mode} />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("AuthGate", () => {
  beforeEach(() => {
    loginWithPassword.mockReset();
    registerWithPassword.mockReset();
    loginWithGoogle.mockReset();
    requestOtp.mockReset();
    verifyOtp.mockReset();
    requestMagicLink.mockReset();
    verifyMagicLink.mockReset();
    requestGoogleAuthCode.mockReset();
    fetchAuthenticationOptions.mockReset();
    authenticatePasskey.mockReset();
    resetConsumedMagicTokens();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("signs in with email and password", async () => {
    const user = userEvent.setup();
    loginWithPassword.mockResolvedValue(session);
    renderGate("login");
    expect(screen.queryByRole("button", { name: en.auth.gate.google })).not.toBeInTheDocument();
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

  it("signs in with Google GIS when a client id is configured", async () => {
    const user = userEvent.setup();
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client.apps.googleusercontent.com");
    requestGoogleAuthCode.mockResolvedValue("gis-code");
    loginWithGoogle.mockResolvedValue(session);
    renderGate("login");
    await user.click(screen.getByRole("button", { name: en.auth.gate.google }));
    expect(loginWithGoogle).toHaveBeenCalledWith("gis-code");
    expect(useAccountsStore.getState().activeAccountId).toBe(3);
  });

  it("reports a failed Google popup", async () => {
    const user = userEvent.setup();
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client.apps.googleusercontent.com");
    requestGoogleAuthCode.mockRejectedValue(new Error("google_popup_failed"));
    renderGate("login");
    await user.click(screen.getByRole("button", { name: en.auth.gate.google }));
    expect(await screen.findByText(en.auth.gate.google_failed)).toBeInTheDocument();
    expect(loginWithGoogle).not.toHaveBeenCalled();
  });

  it("reports a failed Google token exchange", async () => {
    const user = userEvent.setup();
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "client.apps.googleusercontent.com");
    requestGoogleAuthCode.mockResolvedValue("gis-code");
    loginWithGoogle.mockRejectedValue(new Error("nope"));
    renderGate("login");
    await user.click(screen.getByRole("button", { name: en.auth.gate.google }));
    expect(await screen.findByText(en.auth.gate.google_failed)).toBeInTheDocument();
  });

  it("requests and verifies an email OTP", async () => {
    const user = userEvent.setup();
    requestOtp.mockResolvedValue({ accepted: true });
    verifyOtp.mockResolvedValue(session);
    renderGate("login");
    await user.click(screen.getByRole("button", { name: en.auth.gate.otp }));
    await user.type(screen.getByLabelText(en.auth.gate.email), "ada@example.com");
    await user.click(screen.getByRole("button", { name: en.auth.gate.otp_send }));
    expect(requestOtp).toHaveBeenCalledWith("ada@example.com");
    await user.type(screen.getByLabelText(en.auth.gate.otp_code), "123456");
    await user.click(screen.getByRole("button", { name: en.auth.gate.otp_verify }));
    expect(verifyOtp).toHaveBeenCalledWith("ada@example.com", "123456");
  });

  it("surfaces OTP request and verify failures and lets the user resend", async () => {
    const user = userEvent.setup();
    requestOtp.mockRejectedValueOnce(new Error("nope")).mockResolvedValue({ accepted: true });
    verifyOtp.mockRejectedValue(new Error("nope"));
    renderGate("login");
    await user.click(screen.getByRole("button", { name: en.auth.gate.otp }));
    await user.type(screen.getByLabelText(en.auth.gate.email), "ada@example.com");
    await user.click(screen.getByRole("button", { name: en.auth.gate.otp_send }));
    expect(await screen.findByText(en.auth.gate.otp_failed)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.auth.gate.otp_send }));
    await user.click(screen.getByRole("button", { name: en.auth.gate.otp_resend }));
    await user.click(screen.getByRole("button", { name: en.auth.gate.otp_send }));
    await user.type(screen.getByLabelText(en.auth.gate.otp_code), "123456");
    await user.click(screen.getByRole("button", { name: en.auth.gate.otp_verify }));
    expect(await screen.findByText(en.auth.gate.otp_failed)).toBeInTheDocument();
  });

  it("sends a magic link and consumes a mailed token", async () => {
    const user = userEvent.setup();
    requestMagicLink.mockRejectedValueOnce(new Error("nope")).mockResolvedValue({ accepted: true });
    verifyMagicLink.mockResolvedValue(session);
    const sent = renderGate("login");
    await user.click(screen.getByRole("button", { name: en.auth.gate.magic }));
    await user.type(screen.getByLabelText(en.auth.gate.email), "ada@example.com");
    await user.click(screen.getByRole("button", { name: en.auth.gate.magic_send }));
    expect(await screen.findByText(en.auth.gate.magic_failed)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.auth.gate.magic_send }));
    expect(await screen.findByText(en.auth.gate.magic_sent)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.auth.gate.magic_retry }));
    expect(screen.getByRole("button", { name: en.auth.gate.magic_send })).toBeInTheDocument();
    sent.unmount();
    renderGate("login", "/auth/magic?token=mailed");
    await waitFor(() => expect(verifyMagicLink).toHaveBeenCalledWith("mailed"));
  });

  it("reports a failed magic-link token and ignores a missing token", async () => {
    verifyMagicLink.mockRejectedValue(new Error("nope"));
    renderGate("login", "/auth/magic?token=bad");
    expect(await screen.findByText(en.auth.gate.magic_failed)).toBeInTheDocument();
    renderGate("login", "/auth/magic");
    expect(verifyMagicLink).toHaveBeenCalledTimes(1);
  });

  it("signs in with a passkey and ignores a cancelled prompt", async () => {
    const user = userEvent.setup();
    fetchAuthenticationOptions.mockResolvedValue({ challenge: "YQ", nonce: "n" });
    authenticatePasskey.mockResolvedValue(session);
    const get = vi.fn().mockResolvedValue({
      id: "cred",
      rawId: new Uint8Array([1]).buffer,
      type: "public-key",
      response: {
        authenticatorData: new Uint8Array([2]).buffer,
        clientDataJSON: new Uint8Array([3]).buffer,
        signature: new Uint8Array([4]).buffer,
        userHandle: null,
      },
    });
    Object.defineProperty(navigator, "credentials", { configurable: true, value: { get } });
    renderGate("login");
    await user.click(screen.getByRole("button", { name: en.auth.gate.passkey }));
    expect(authenticatePasskey).toHaveBeenCalled();
    get.mockResolvedValueOnce(null);
    await user.click(screen.getByRole("button", { name: en.auth.gate.passkey }));
    expect(authenticatePasskey).toHaveBeenCalledTimes(1);
    const denied = new Error("denied");
    denied.name = "NotAllowedError";
    get.mockRejectedValueOnce(denied);
    await user.click(screen.getByRole("button", { name: en.auth.gate.passkey }));
    fetchAuthenticationOptions.mockRejectedValueOnce(new Error("nope"));
    await user.click(screen.getByRole("button", { name: en.auth.gate.passkey }));
    expect(await screen.findByText(en.auth.gate.passkey_failed)).toBeInTheDocument();
  });
});
