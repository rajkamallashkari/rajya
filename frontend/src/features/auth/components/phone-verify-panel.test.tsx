import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PhoneVerifyPanel } from "./phone-verify-panel";
import { AppProviders } from "@/app/providers";
import { PHONE_VERIFICATION_POLL_MS } from "@/features/auth/model/phone-config";
import { en } from "@/shared/lib/i18n/catalog";
import { getToast, dismissToast } from "@/shared/ui/toast";

const fetchMe = vi.fn();
const issuePhoneVerification = vi.fn();
const fetchPhoneVerification = vi.fn();

vi.mock("@/features/auth/api/identity", () => ({
  fetchMe: (...args: unknown[]) => fetchMe(...args),
}));

vi.mock("@/features/auth/api/phone", () => ({
  issuePhoneVerification: (...args: unknown[]) => issuePhoneVerification(...args),
  fetchPhoneVerification: (...args: unknown[]) => fetchPhoneVerification(...args),
}));

describe("PhoneVerifyPanel", () => {
  beforeEach(() => {
    fetchMe.mockReset();
    issuePhoneVerification.mockReset();
    fetchPhoneVerification.mockReset();
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    dismissToast();
  });

  it("opens WhatsApp, polls until confirmed, and toasts a changed number", async () => {
    const user = userEvent.setup();
    fetchMe.mockResolvedValue({ user: { phone: "1555000" } });
    issuePhoneVerification.mockResolvedValue({
      status: "pending",
      wa_url: "https://wa.me/1?text=1",
    });
    fetchPhoneVerification
      .mockResolvedValueOnce({ status: "pending", confirmed_phone: null })
      .mockRejectedValueOnce(new Error("flaky"))
      .mockResolvedValueOnce({ status: "confirmed", confirmed_phone: "1555999" });
    render(
      <AppProviders>
        <PhoneVerifyPanel />
      </AppProviders>,
    );
    await user.click(screen.getByRole("button", { name: en.auth.phone.verify }));
    expect(window.open).toHaveBeenCalledWith(
      "https://wa.me/1?text=1",
      "_blank",
      "noopener,noreferrer",
    );
    expect(screen.getByRole("button", { name: en.auth.phone.waiting })).toBeDisabled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PHONE_VERIFICATION_POLL_MS);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PHONE_VERIFICATION_POLL_MS);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PHONE_VERIFICATION_POLL_MS);
    });
    expect(await screen.findByText(en.auth.phone.confirmed)).toBeInTheDocument();
    expect(getToast()?.title).toBe(en.auth.phone.changed.replace("{{phone}}", "1555999"));
  });

  it("does not toast when the number is unchanged and handles a missing deep link", async () => {
    const user = userEvent.setup();
    fetchMe.mockResolvedValue({ user: { phone: "1555111" } });
    issuePhoneVerification.mockResolvedValue({ status: "pending", wa_url: null });
    fetchPhoneVerification.mockResolvedValue({ status: "confirmed", confirmed_phone: "1555111" });
    render(
      <AppProviders>
        <PhoneVerifyPanel />
      </AppProviders>,
    );
    await user.click(screen.getByRole("button", { name: en.auth.phone.verify }));
    expect(window.open).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PHONE_VERIFICATION_POLL_MS);
    });
    expect(await screen.findByText(en.auth.phone.confirmed)).toBeInTheDocument();
    expect(getToast()?.title).not.toBe(en.auth.phone.changed.replace("{{phone}}", "1555111"));
  });

  it("shows an error when issuance fails", async () => {
    const user = userEvent.setup();
    fetchMe.mockResolvedValue({ user: {} });
    issuePhoneVerification.mockRejectedValue(new Error("nope"));
    render(
      <AppProviders>
        <PhoneVerifyPanel />
      </AppProviders>,
    );
    await user.click(screen.getByRole("button", { name: en.auth.phone.verify }));
    expect(await screen.findByText(en.auth.phone.failed)).toBeInTheDocument();
  });
});
