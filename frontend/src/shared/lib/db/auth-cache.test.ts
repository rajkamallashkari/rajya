import { describe, expect, it } from "vitest";
import { clearAuthCache, getAuthCache, setAuthCache } from "./auth-cache";

describe("auth cache", () => {
  it("writes and clears the service-worker auth record", async () => {
    expect(await getAuthCache(1)).toBeUndefined();
    await setAuthCache(1, { accountId: 1, apiUrl: "https://rajya.test", token: "tok" });
    expect(await getAuthCache(1)).toEqual({
      accountId: 1,
      apiUrl: "https://rajya.test",
      token: "tok",
    });
    await clearAuthCache(1);
    expect(await getAuthCache(1)).toBeUndefined();
  });
});
