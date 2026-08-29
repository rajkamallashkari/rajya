import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApiClient } from "../client";
import { handlerMap, handlers } from "./handlers";

const server = setupServer(...handlers);

describe("MSW handlers", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("serves every generated path with typed bodies", async () => {
    expect(Object.keys(handlerMap).sort()).toEqual(
      [
        "/auth/forgot_password",
        "/auth/google",
        "/auth/login",
        "/auth/magic_link/request",
        "/auth/magic_link/verify",
        "/auth/otp/request",
        "/auth/otp/verify",
        "/auth/register",
        "/auth/reset_password",
        "/health",
        "/up",
      ].sort(),
    );
    expect(handlers).toHaveLength(Object.keys(handlerMap).length);
    const client = createApiClient("http://rajya.test");
    const health = await client.GET("/health");
    expect(health.data?.status).toBe("ok");
    const up = await fetch("http://rajya.test/up");
    expect(up.status).toBe(200);
    const login = await client.POST("/auth/login", {
      body: { email: "ada@example.com", password: "password12" },
    });
    expect(login.data?.token).toBe("test-token");
    const google = await client.POST("/auth/google", { body: { code: "gis" } });
    expect(google.data?.token).toBe("test-token");
    const register = await client.POST("/auth/register", {
      body: { email: "ada@example.com", name: "Ada", password: "password12", password_confirmation: "password12" },
    });
    expect(register.data?.token).toBe("test-token");
    const reset = await client.POST("/auth/reset_password", {
      body: { token: "tok", password: "password12", password_confirmation: "password12" },
    });
    expect(reset.data?.token).toBe("test-token");
    const otpVerify = await client.POST("/auth/otp/verify", {
      body: { email: "ada@example.com", code: "000000" },
    });
    expect(otpVerify.data?.token).toBe("test-token");
    const magicVerify = await client.POST("/auth/magic_link/verify", { body: { token: "tok" } });
    expect(magicVerify.data?.token).toBe("test-token");
    const otp = await client.POST("/auth/otp/request", { body: { email: "ada@example.com" } });
    expect(otp.data?.accepted).toBe(true);
    const magic = await client.POST("/auth/magic_link/request", { body: { email: "ada@example.com" } });
    expect(magic.data?.accepted).toBe(true);
    const forgot = await client.POST("/auth/forgot_password", { body: { email: "ada@example.com" } });
    expect(forgot.data?.accepted).toBe(true);
  });
});
