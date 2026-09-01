import { describe, expect, it } from "vitest";
import {
  beginImpersonation,
  endImpersonation,
  getAccessSession,
  isImpersonating,
  setAccessSession,
} from "./access-session";

describe("access-session", () => {
  it("holds the current token and unlock methods", () => {
    expect(getAccessSession()).toBeNull();
    const session = {
      accountId: 7,
      displayName: "Ada",
      hasPasskey: true,
      hasPassword: false,
      onboarded: false,
      token: "tok",
      username: "ada",
    };
    setAccessSession(session);
    expect(getAccessSession()).toEqual(session);
    setAccessSession(null);
    expect(getAccessSession()).toBeNull();
  });

  it("swaps to an impersonation session and restores the original", () => {
    const original = {
      accountId: 1,
      displayName: "Ada",
      hasPasskey: true,
      hasPassword: true,
      onboarded: true,
      token: "admin-token",
      username: "ada",
    };
    const impersonated = {
      ...original,
      accountId: 2,
      displayName: "Peer",
      token: "impersonation-token",
      username: "user2",
    };
    setAccessSession(original);
    beginImpersonation(impersonated);
    beginImpersonation(impersonated);
    expect(isImpersonating()).toBe(true);
    expect(getAccessSession()?.token).toBe("impersonation-token");
    endImpersonation();
    expect(isImpersonating()).toBe(false);
    expect(getAccessSession()?.token).toBe("admin-token");
    endImpersonation();
    expect(getAccessSession()?.token).toBe("admin-token");
  });
});
