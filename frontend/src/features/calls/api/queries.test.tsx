import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/app/providers";
import { setAccessSession } from "@/features/auth/model/access-session";
import { useCallLog } from "./queries";
import { testSession } from "@/test/access-session";

describe("useCallLog", () => {
  it("loads the first page of the call log", async () => {
    setAccessSession(testSession({ token: "jwt" }));
    const { result } = renderHook(() => useCallLog(), { wrapper: AppProviders });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.pages[0]?.calls.length).toBeGreaterThan(0);
  });
});
