import { describe, expect, it } from "vitest";
import * as calls from "@/features/calls";

describe("calls barrel", () => {
  it("re-exports overlay surfaces and stores", () => {
    expect(typeof calls.CallOverlays).toBe("function");
    expect(typeof calls.TopCallBar).toBe("function");
    expect(typeof calls.useSignalingChannel).toBe("function");
    expect(typeof calls.useWebRTCManager).toBe("function");
    expect(typeof calls.useCallStore).toBe("function");
    expect(typeof calls.resetCallStore).toBe("function");
  });
});
