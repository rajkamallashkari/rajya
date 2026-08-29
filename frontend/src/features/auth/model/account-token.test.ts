import { describe, expect, it } from "vitest";
import { ACCOUNTS_STORAGE_KEY, isJwtExpired } from "./account-token";

function jwt(payload: object): string {
  const encoded = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return `hdr.${encoded}.sig`;
}

describe("account tokens", () => {
  it("treats opaque tokens as current and JWTs by exp", () => {
    expect(ACCOUNTS_STORAGE_KEY).toBe("rajya:accounts");
    expect(isJwtExpired("opaque")).toBe(false);
    expect(isJwtExpired(jwt({ exp: Math.floor(Date.now() / 1000) + 60 }))).toBe(false);
    expect(isJwtExpired(jwt({ exp: 1 }))).toBe(true);
    expect(isJwtExpired(jwt({}))).toBe(true);
    expect(isJwtExpired("a.not-json.b")).toBe(true);
  });
});
