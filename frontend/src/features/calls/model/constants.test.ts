import { describe, expect, it } from "vitest";
import {
  DIRECT_PARTICIPANT_MAX,
  GROUP_VIDEO_CONSTRAINTS,
  RING_TIMEOUT_MS,
  groupVideoConstraints,
} from "./constants";
import { isLiveCallStatus } from "./live";

describe("call constants", () => {
  it("caps group video at 640×480 and 20 fps (BR-111)", () => {
    expect(GROUP_VIDEO_CONSTRAINTS).toEqual(groupVideoConstraints());
    expect(GROUP_VIDEO_CONSTRAINTS).toMatchObject({
      width: { ideal: 640, max: 640 },
      height: { ideal: 480, max: 480 },
      frameRate: { ideal: 20, max: 20 },
    });
    expect(DIRECT_PARTICIPANT_MAX).toBe(2);
    expect(RING_TIMEOUT_MS).toBe(45_000);
  });

  it("treats ringing-outgoing, connecting, and active as live", () => {
    expect(isLiveCallStatus("idle")).toBe(false);
    expect(isLiveCallStatus("ringing-incoming")).toBe(false);
    expect(isLiveCallStatus("ringing-outgoing")).toBe(true);
    expect(isLiveCallStatus("connecting")).toBe(true);
    expect(isLiveCallStatus("active")).toBe(true);
    expect(isLiveCallStatus("ended")).toBe(false);
  });
});
