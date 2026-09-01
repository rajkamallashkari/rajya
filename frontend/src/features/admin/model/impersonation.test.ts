import { describe, expect, it } from "vitest";
import { startImpersonation, stopImpersonationLocally, sessionToAccess } from "./impersonation";
import { getAccessSession, isImpersonating } from "@/features/auth/model/access-session";
import { useShellStore } from "@/features/settings/store/shell-store";

const payload = {
  token: "impersonation-token",
  account: { id: 2, username: "user2", display_name: "Peer", kind: "human" as const },
  user: {
    id: 1,
    email: "ada@example.com",
    onboarded: true,
    has_password: true,
    has_passkey: false,
    phone_verified: false,
    is_admin: true,
  },
};

describe("impersonation model", () => {
  it("maps a session payload and toggles the shell banner", () => {
    expect(sessionToAccess(payload)).toMatchObject({
      accountId: 2,
      token: "impersonation-token",
      displayName: "Peer",
    });
    startImpersonation(payload);
    expect(isImpersonating()).toBe(true);
    expect(getAccessSession()?.token).toBe("impersonation-token");
    expect(useShellStore.getState().impersonatingName).toBe("Peer");
    stopImpersonationLocally();
    expect(isImpersonating()).toBe(false);
    expect(useShellStore.getState().impersonatingName).toBeNull();
  });
});
