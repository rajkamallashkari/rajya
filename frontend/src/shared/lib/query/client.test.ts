import { describe, expect, it } from "vitest";
import { createQueryClient } from "./client";

describe("createQueryClient", () => {
  it("disables retries", () => {
    const client = createQueryClient();
    expect(client.getDefaultOptions().queries?.retry).toBe(false);
    expect(client.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
  });
});
