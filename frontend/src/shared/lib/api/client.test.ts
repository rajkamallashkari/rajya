import { describe, expect, it } from "vitest";
import { createApiClient } from "./client";

describe("createApiClient", () => {
  it("returns a typed openapi-fetch client", () => {
    const client = createApiClient("https://example.test");
    expect(typeof client.GET).toBe("function");
    expect(typeof client.POST).toBe("function");
  });
});
