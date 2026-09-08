import { describe, expect, it } from "vitest";
import { needsSignIn } from "./session-gate";

describe("needsSignIn", () => {
  it("asks for credentials only when there is no account and mocks are off", () => {
    expect(needsSignIn(null)).toBe(true);
    expect(needsSignIn(null, undefined)).toBe(true);
    expect(needsSignIn(null, "0")).toBe(true);
    expect(needsSignIn(null, "1")).toBe(false);
    expect(needsSignIn(null, "true")).toBe(false);
    expect(needsSignIn(null, "1", true)).toBe(true);
    expect(needsSignIn(1)).toBe(false);
    expect(needsSignIn(1, "1")).toBe(false);
    expect(needsSignIn(1, "1", true)).toBe(false);
  });
});
