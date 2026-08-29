import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingWizard } from "./onboarding-wizard";
import { setAccessSession } from "@/features/auth/model/access-session";
import { testSession } from "@/test/access-session";
import { en } from "@/shared/lib/i18n/catalog";

const checkUsername = vi.fn();
const updateProfile = vi.fn();
const completeOnboarding = vi.fn();
const setPassword = vi.fn();
const fetchRegistrationOptions = vi.fn();
const registerPasskey = vi.fn();

vi.mock("@/features/auth/api/identity", () => ({
  checkUsername: (...args: unknown[]) => checkUsername(...args),
  updateProfile: (...args: unknown[]) => updateProfile(...args),
  completeOnboarding: (...args: unknown[]) => completeOnboarding(...args),
  setPassword: (...args: unknown[]) => setPassword(...args),
}));

vi.mock("@/features/auth/api/passkeys", () => ({
  fetchRegistrationOptions: (...args: unknown[]) => fetchRegistrationOptions(...args),
  registerPasskey: (...args: unknown[]) => registerPasskey(...args),
}));

const me = {
  account: { id: 1, username: "ada", display_name: "Ada", kind: "human" },
  user: { id: 1, onboarded: false, has_password: false, has_passkey: false },
};

describe("OnboardingWizard", () => {
  beforeEach(() => {
    checkUsername.mockReset();
    updateProfile.mockReset();
    completeOnboarding.mockReset();
    setPassword.mockReset();
    fetchRegistrationOptions.mockReset();
    registerPasskey.mockReset();
    setAccessSession(testSession({ onboarded: false, hasPassword: false, hasPasskey: false }));
  });

  it("walks profile, skipped password, and skipped passkey", async () => {
    const user = userEvent.setup();
    checkUsername.mockResolvedValue({ available: true });
    updateProfile.mockResolvedValue(me);
    completeOnboarding.mockResolvedValue({
      ...me,
      user: { ...me.user, onboarded: true },
    });
    render(<OnboardingWizard />);
    await user.clear(screen.getByLabelText(en.auth.onboarding.display_name));
    await user.type(screen.getByLabelText(en.auth.onboarding.display_name), "Ada");
    await user.clear(screen.getByLabelText(en.auth.onboarding.username));
    await user.type(screen.getByLabelText(en.auth.onboarding.username), "ada");
    await user.click(screen.getByRole("button", { name: en.auth.onboarding.continue }));
    expect(await screen.findByText(en.auth.onboarding.password_title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.auth.onboarding.skip }));
    expect(screen.getByText(en.auth.onboarding.passkey_title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.auth.onboarding.skip }));
    expect(completeOnboarding).toHaveBeenCalled();
  });

  it("blocks a taken username and surfaces profile errors", async () => {
    const user = userEvent.setup();
    checkUsername.mockResolvedValue({ available: false });
    render(<OnboardingWizard />);
    await user.type(screen.getByLabelText(en.auth.onboarding.display_name), "Ada");
    await user.clear(screen.getByLabelText(en.auth.onboarding.username));
    await user.type(screen.getByLabelText(en.auth.onboarding.username), "taken");
    await user.click(screen.getByRole("button", { name: en.auth.onboarding.continue }));
    expect(await screen.findByText(en.auth.onboarding.username_taken)).toBeInTheDocument();
    checkUsername.mockRejectedValue(new Error("nope"));
    await user.click(screen.getByRole("button", { name: en.auth.onboarding.continue }));
    expect(await screen.findByText(en.auth.onboarding.profile_failed)).toBeInTheDocument();
  });

  it("saves a password and registers a passkey", async () => {
    const user = userEvent.setup();
    setPassword.mockResolvedValue({
      token: "tok",
      ...me,
      user: { ...me.user, has_password: true },
    });
    fetchRegistrationOptions.mockResolvedValue({
      challenge: "YQ",
      rp: { name: "Rajya", id: "localhost" },
      user: { id: "YQ", name: "ada", displayName: "Ada" },
    });
    registerPasskey.mockResolvedValue({ id: 1 });
    completeOnboarding.mockResolvedValue({ ...me, user: { ...me.user, onboarded: true } });
    const create = vi.fn().mockResolvedValue({
      id: "cred",
      rawId: new Uint8Array([1]).buffer,
      type: "public-key",
      response: {
        attestationObject: new Uint8Array([2]).buffer,
        clientDataJSON: new Uint8Array([3]).buffer,
      },
    });
    Object.defineProperty(navigator, "credentials", {
      configurable: true,
      value: { create },
    });
    render(<OnboardingWizard initialStep="password" />);
    await user.type(screen.getByLabelText(en.auth.onboarding.password), "password12");
    await user.type(screen.getByLabelText(en.auth.onboarding.password_confirm), "nope");
    await user.click(screen.getByRole("button", { name: en.auth.onboarding.save_password }));
    expect(screen.getByText(en.auth.onboarding.password_mismatch)).toBeInTheDocument();
    await user.clear(screen.getByLabelText(en.auth.onboarding.password_confirm));
    await user.type(screen.getByLabelText(en.auth.onboarding.password_confirm), "password12");
    await user.click(screen.getByRole("button", { name: en.auth.onboarding.save_password }));
    expect(await screen.findByText(en.auth.onboarding.passkey_title)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.auth.onboarding.add_passkey }));
    expect(registerPasskey).toHaveBeenCalled();
    expect(completeOnboarding).toHaveBeenCalled();
  });

  it("skips a cancelled passkey and reports failures", async () => {
    const user = userEvent.setup();
    setPassword.mockRejectedValue(new Error("nope"));
    const passwordStep = render(<OnboardingWizard initialStep="password" />);
    await user.type(screen.getByLabelText(en.auth.onboarding.password), "password12");
    await user.type(screen.getByLabelText(en.auth.onboarding.password_confirm), "password12");
    await user.click(screen.getByRole("button", { name: en.auth.onboarding.save_password }));
    expect(await screen.findByText(en.auth.onboarding.password_failed)).toBeInTheDocument();
    passwordStep.unmount();

    fetchRegistrationOptions.mockResolvedValue({
      challenge: "YQ",
      rp: { name: "Rajya", id: "localhost" },
      user: { id: "YQ", name: "ada", displayName: "Ada" },
    });
    Object.defineProperty(navigator, "credentials", {
      configurable: true,
      value: { create: vi.fn().mockResolvedValue(null) },
    });
    const cancelled = render(<OnboardingWizard initialStep="passkey" />);
    await user.click(screen.getByRole("button", { name: en.auth.onboarding.add_passkey }));
    expect(registerPasskey).not.toHaveBeenCalled();
    cancelled.unmount();

    fetchRegistrationOptions.mockRejectedValue(new Error("nope"));
    completeOnboarding.mockRejectedValue(new Error("nope"));
    render(<OnboardingWizard initialStep="passkey" />);
    await user.click(screen.getByRole("button", { name: en.auth.onboarding.add_passkey }));
    expect(await screen.findByText(en.auth.onboarding.passkey_failed)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.auth.onboarding.skip }));
    expect(await screen.findByText(en.auth.onboarding.profile_failed)).toBeInTheDocument();
  });

  it("keeps the current username and finishes without a stored token", async () => {
    const user = userEvent.setup();
    checkUsername.mockResolvedValue({ available: false });
    updateProfile.mockResolvedValue(me);
    completeOnboarding.mockResolvedValue({ ...me, user: { ...me.user, onboarded: true } });
    const profile = render(<OnboardingWizard />);
    await user.click(screen.getByRole("button", { name: en.auth.onboarding.continue }));
    expect(await screen.findByText(en.auth.onboarding.password_title)).toBeInTheDocument();
    profile.unmount();
    setAccessSession(null);
    render(<OnboardingWizard initialStep="passkey" />);
    await user.click(screen.getByRole("button", { name: en.auth.onboarding.skip }));
    expect(completeOnboarding).toHaveBeenCalled();
  });
});
