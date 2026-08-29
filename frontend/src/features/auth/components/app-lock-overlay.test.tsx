import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppLockOverlay } from "@/features/auth";
import { setAccessSession } from "@/features/auth/model/access-session";
import { useLockStore } from "@/features/auth/store/lock-store";
import { en } from "@/shared/lib/i18n/catalog";

function lockWith(session: Parameters<typeof setAccessSession>[0]) {
  setAccessSession(session);
  useLockStore.setState({ locked: true, unlocking: false, unlockErrorKey: null });
}

describe("AppLockOverlay", () => {
  afterEach(() => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  });

  it("renders nothing while unlocked", () => {
    render(<AppLockOverlay />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows a loading prompt when locked without a session", () => {
    useLockStore.setState({ locked: true });
    render(<AppLockOverlay />);
    expect(screen.getByRole("dialog", { name: en.auth.lock.aria })).toHaveFocus();
    expect(screen.getByText(en.auth.lock.loading)).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  });

  it("notifies the store on visibility changes", () => {
    const onVisibilityHidden = vi.fn();
    const onVisibilityVisible = vi.fn();
    useLockStore.setState({ onVisibilityHidden, onVisibilityVisible });
    render(<AppLockOverlay />);
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    fireEvent(document, new Event("visibilitychange"));
    expect(onVisibilityHidden).toHaveBeenCalled();
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    fireEvent(document, new Event("visibilitychange"));
    expect(onVisibilityVisible).toHaveBeenCalled();
  });

  it("unlocks with a passkey and can fall back to a password", async () => {
    const user = userEvent.setup();
    const unlockWithPasskey = vi.fn().mockResolvedValue(null);
    const unlockWithPassword = vi.fn().mockResolvedValue(null);
    lockWith({
      accountId: 1,
      hasPasskey: true,
      hasPassword: true,
      token: "tok",
      username: "ada",
    });
    useLockStore.setState({ unlockWithPasskey, unlockWithPassword });
    render(<AppLockOverlay />);
    expect(screen.getByText("@ada")).toBeInTheDocument();
    expect(screen.getByText(en.auth.lock.passkey_prompt)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.auth.lock.unlock_passkey }));
    expect(unlockWithPasskey).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: en.auth.lock.use_password }));
    expect(screen.getByPlaceholderText(en.auth.lock.password_placeholder)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: en.auth.lock.unlock_password })).toBeDisabled();
    await user.type(screen.getByPlaceholderText(en.auth.lock.password_placeholder), "secret12");
    await user.click(screen.getByRole("button", { name: en.auth.lock.unlock_password }));
    expect(unlockWithPassword).toHaveBeenCalledWith("secret12");
    await user.click(screen.getByRole("button", { name: en.auth.lock.use_passkey }));
    expect(screen.getByRole("button", { name: en.auth.lock.unlock_passkey })).toBeInTheDocument();
  });

  it("keeps the password when unlock fails and clears it on success", async () => {
    const user = userEvent.setup();
    const unlockWithPassword = vi
      .fn()
      .mockResolvedValueOnce("auth.lock.password_incorrect")
      .mockResolvedValueOnce(null);
    lockWith({
      accountId: 1,
      hasPasskey: false,
      hasPassword: true,
      token: "tok",
      username: "",
    });
    useLockStore.setState({ unlockWithPassword, unlockErrorKey: "auth.lock.password_incorrect" });
    render(<AppLockOverlay />);
    expect(screen.queryByText("@")).toBeNull();
    expect(screen.getByText(en.auth.lock.password_prompt)).toBeInTheDocument();
    expect(screen.getByText(en.auth.lock.password_incorrect)).toBeInTheDocument();
    const field = screen.getByPlaceholderText(en.auth.lock.password_placeholder);
    await user.type(field, "wrong");
    await user.click(screen.getByRole("button", { name: en.auth.lock.unlock_password }));
    expect(field).toHaveValue("wrong");
    await user.click(screen.getByRole("button", { name: en.auth.lock.unlock_password }));
    expect(field).toHaveValue("");
  });

  it("shows unlocking copy, offline, and no-method states", () => {
    lockWith({
      accountId: 1,
      hasPasskey: true,
      hasPassword: false,
      token: "tok",
      username: "ada",
    });
    useLockStore.setState({ unlocking: true });
    const { unmount } = render(<AppLockOverlay />);
    expect(screen.getByRole("button", { name: en.auth.lock.unlocking })).toBeDisabled();
    unmount();

    lockWith({
      accountId: 1,
      hasPasskey: false,
      hasPassword: true,
      token: "tok",
      username: "ada",
    });
    useLockStore.setState({ unlocking: true });
    const again = render(<AppLockOverlay />);
    expect(screen.getByRole("button", { name: en.auth.lock.unlocking })).toBeDisabled();
    again.unmount();

    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    lockWith({
      accountId: 1,
      hasPasskey: true,
      hasPassword: true,
      token: "tok",
      username: "ada",
    });
    const offline = render(<AppLockOverlay />);
    expect(screen.getByText(en.auth.lock.offline)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: en.auth.lock.unlock_passkey })).toBeNull();
    offline.unmount();

    lockWith({
      accountId: 1,
      hasPasskey: false,
      hasPassword: false,
      token: "tok",
      username: "ada",
    });
    render(<AppLockOverlay />);
    expect(screen.getByText(en.auth.lock.subtitle_no_method)).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
