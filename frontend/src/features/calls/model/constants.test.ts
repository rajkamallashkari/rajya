import { describe, expect, it } from "vitest";
import { GROUP_VIDEO_CONSTRAINTS, groupVideoConstraints } from "./constants";

describe("call constants", () => {
  it("caps group video at 640×480 and 20 fps (BR-111)", () => {
    expect(GROUP_VIDEO_CONSTRAINTS).toEqual(groupVideoConstraints());
    expect(GROUP_VIDEO_CONSTRAINTS).toMatchObject({
      width: { ideal: 640, max: 640 },
      height: { ideal: 480, max: 480 },
      frameRate: { ideal: 20, max: 20 },
    });
  });
});
