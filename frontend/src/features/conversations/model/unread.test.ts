import { describe, expect, it } from "vitest";
import { formatUnread } from "./unread";

describe("formatUnread", () => {
  it("caps the badge the way the legacy list did", () => {
    expect(formatUnread(0)).toBe("");
    expect(formatUnread(-1)).toBe("");
    expect(formatUnread(3)).toBe("3");
    expect(formatUnread(9)).toBe("9");
    expect(formatUnread(10)).toBe("9+");
    expect(formatUnread(99)).toBe("9+");
    expect(formatUnread(100)).toBe("99+");
    expect(formatUnread(999)).toBe("99+");
    expect(formatUnread(1000)).toBe("999+");
  });
});
