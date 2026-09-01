import { describe, expect, it } from "vitest";
import * as calls from "@/features/calls";

describe("calls barrel", () => {
  it("re-exports call chrome and stores", () => {
    expect(typeof calls.TopCallBar).toBe("function");
    expect(typeof calls.useSignalingChannel).toBe("function");
    expect(typeof calls.useWebRTCManager).toBe("function");
    expect(typeof calls.useCallStore).toBe("function");
    expect(typeof calls.resetCallStore).toBe("function");
  });
});
