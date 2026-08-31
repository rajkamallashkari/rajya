import { beforeEach, describe, expect, it, vi } from "vitest";
import { setAccessSession } from "@/features/auth/model/access-session";
import { testSession } from "@/test/access-session";

const mockClient = vi.hoisted(() => ({
  GET: vi.fn(),
  POST: vi.fn(),
}));

vi.mock("@/features/auth/api/http", async () => {
  const actual = await vi.importActual<typeof import("@/features/auth/api/http")>(
    "@/features/auth/api/http",
  );
  return {
    ...actual,
    apiClient: () => mockClient,
  };
});

describe("calls http", () => {
  beforeEach(() => {
    mockClient.GET.mockReset();
    mockClient.POST.mockReset();
    setAccessSession(testSession({ token: "jwt" }));
  });

  it("creates, accepts, declines, cancels, hangs up, and reads the active call", async () => {
    const http = await import("./http");
    mockClient.POST.mockResolvedValue({ data: { call: { id: 1 } } });
    mockClient.GET.mockResolvedValue({ data: { call: null } });
    await http.createCall(3, "video");
    await http.acceptCallRequest(1);
    await http.declineCallRequest(1);
    await http.cancelCallRequest(1);
    await http.hangupCallRequest(1);
    await http.setScreenSharingRequest(1, true);
    await http.getActiveCall();
    expect(mockClient.POST).toHaveBeenCalled();
    expect(mockClient.GET).toHaveBeenCalled();
  });

  it("sends a keepalive hangup on unload", async () => {
    const http = await import("./http");
    const fetchMock = vi.fn().mockResolvedValue({});
    vi.stubGlobal("fetch", fetchMock);
    http.endCallOnUnload(9, "hangup");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/calls/9/hangup"),
      expect.objectContaining({ keepalive: true, method: "POST" }),
    );
    setAccessSession(null);
    http.endCallOnUnload(2, "cancel");
    vi.unstubAllGlobals();
  });

  it("swallows keepalive fetch failures", async () => {
    const http = await import("./http");
    vi.stubGlobal("fetch", () => {
      throw new Error("offline");
    });
    expect(() => http.endCallOnUnload(1, "cancel")).not.toThrow();
    vi.unstubAllGlobals();
  });
});
