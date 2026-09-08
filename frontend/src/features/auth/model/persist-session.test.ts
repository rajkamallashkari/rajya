import { describe, expect, it } from "vitest";
import { persistSession } from "./persist-session";
import { getAccessSession, setAccessSession } from "./access-session";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { testSession } from "@/test/access-session";

const payload = {
  account: { display_name: "Ada", id: 9, username: "ada" },
  token: "jwt-token",
  user: { has_passkey: false, has_password: true, onboarded: false },
};

describe("persistSession", () => {
  it("activates the signed-in account", () => {
    persistSession(payload);
    expect(useAccountsStore.getState().activeAccountId).toBe(9);
    expect(getAccessSession()?.token).toBe("jwt-token");
  });

  it("reuses the current token and throws without one", () => {
    setAccessSession(testSession({ token: "kept" }));
    persistSession({ ...payload, token: undefined, user: { ...payload.user, onboarded: true } });
    expect(getAccessSession()?.onboarded).toBe(true);
    expect(getAccessSession()?.token).toBe("kept");
    setAccessSession(null);
    expect(() => persistSession({ ...payload, token: undefined })).toThrow("session_token_missing");
  });
});
