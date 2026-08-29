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
    expect(Object.keys(handlerMap).sort()).toEqual(["/health", "/up"]);
    expect(handlers).toHaveLength(2);
    const client = createApiClient("http://rajya.test");
    const health = await client.GET("/health");
    expect(health.data?.status).toBe("ok");
    const up = await fetch("http://rajya.test/up");
    expect(up.status).toBe(200);
  });
});
