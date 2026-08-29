import { describe, expect, it } from "vitest";
import { getAccessSession, setAccessSession } from "./access-session";

describe("access-session", () => {
  it("holds the current token and unlock methods", () => {
    expect(getAccessSession()).toBeNull();
    const session = {
      accountId: 7,
      hasPasskey: true,
      hasPassword: false,
      token: "tok",
      username: "ada",
    };
    setAccessSession(session);
    expect(getAccessSession()).toEqual(session);
    setAccessSession(null);
    expect(getAccessSession()).toBeNull();
  });
});
