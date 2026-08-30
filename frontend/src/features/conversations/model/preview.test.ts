import { describe, expect, it } from "vitest";
import { lastActivityFromPreview, lastActivityPrefix, lastActivityTone } from "./preview";

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
    expect(lastActivityFromPreview(undefined, "deleted")).toEqual({ kind: "text", text: "" });
    expect(
      lastActivityFromPreview(
        {
          id: 1,
          kind: "text",
          body: "hi",
          deleted: true,
          created_at: "2026-01-01T00:00:00.000Z",
          sender_name: "Ada",
        },
        "deleted",
      ),
    ).toEqual({ kind: "text", senderName: "Ada", text: "deleted" });
    expect(
      lastActivityFromPreview(
        {
          id: 1,
          kind: "system",
          body: "joined",
          deleted: false,
          created_at: "2026-01-01T00:00:00.000Z",
        },
        "deleted",
      ),
    ).toEqual({ kind: "system", text: "joined" });
    expect(
      lastActivityFromPreview(
        {
          id: 1,
          kind: "image",
          deleted: false,
          created_at: "2026-01-01T00:00:00.000Z",
          sender_name: "Ada",
        },
        "deleted",
      ),
    ).toEqual({ kind: "media", mediaType: "image", senderName: "Ada", text: "" });
    expect(
      lastActivityFromPreview(
        { id: 1, kind: "text", body: "hi", deleted: false, created_at: "2026-01-01T00:00:00.000Z" },
        "deleted",
      ),
    ).toEqual({ kind: "text", text: "hi" });
    expect(
      lastActivityFromPreview(
        { id: 1, kind: "system", deleted: false, created_at: "2026-01-01T00:00:00.000Z" },
        "deleted",
      ),
    ).toEqual({ kind: "system", text: "" });
    expect(
      lastActivityFromPreview(
        { id: 1, kind: "text", deleted: false, created_at: "2026-01-01T00:00:00.000Z" },
        "deleted",
      ),
    ).toEqual({ kind: "text", text: "" });
  });
});
