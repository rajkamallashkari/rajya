import { describe, expect, it } from "vitest";
import { lastActivityPrefix, lastActivityTone } from "./preview";

describe("last activity", () => {
  it("picks tone and a group sender prefix", () => {
    expect(lastActivityTone("typing")).toBe("accent");
    expect(lastActivityTone("system")).toBe("italic");
    expect(lastActivityTone("text")).toBe("default");
    expect(lastActivityTone("media")).toBe("default");
    expect(lastActivityPrefix({ kind: "typing", text: "" }, true)).toBeNull();
    expect(lastActivityPrefix({ kind: "system", text: "joined" }, true)).toBeNull();
    expect(lastActivityPrefix({ kind: "text", senderName: "Ada", text: "hi" }, false)).toBeNull();
    expect(lastActivityPrefix({ kind: "text", senderName: "Ada", text: "hi" }, true)).toBe("Ada");
    expect(lastActivityPrefix({ kind: "text", text: "hi" }, true)).toBeNull();
  });
});
