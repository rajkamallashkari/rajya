import { describe, expect, it } from "vitest";
import { apiClient, bearerHeaders, unwrap } from "./http";
import { setAccessSession } from "@/features/auth/model/access-session";
import { testSession } from "@/test/access-session";

describe("auth http helpers", () => {
  it("sends a bearer header only when a session token exists", () => {
    expect(bearerHeaders()).toEqual({});
    setAccessSession(testSession({ token: "abc" }));
    expect(bearerHeaders()).toEqual({ Authorization: "Bearer abc" });
    expect(apiClient()).toBeTruthy();
  });

  it("unwraps data or throws the error or fallback", () => {
    expect(unwrap({ data: { ok: true } }, "fallback")).toEqual({ ok: true });
    expect(() => unwrap({ error: { code: "nope" } }, "fallback")).toThrow();
    try {
      unwrap({ error: { code: "nope" } }, "fallback");
    } catch (error) {
      expect(error).toEqual({ code: "nope" });
    }
    expect(() => unwrap({ data: undefined }, "fallback")).toThrow("fallback");
  });
});
