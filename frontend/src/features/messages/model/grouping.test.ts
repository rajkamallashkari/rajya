import { describe, expect, it } from "vitest";
import { MESSAGE_GROUP_WINDOW_MS } from "./constants";
import {
  bubbleRole,
  groupMessageRuns,
  isWithinGroupWindow,
  showsTail,
  showsTimestampByDefault,
} from "./grouping";

const base = { id: "a", senderId: "1", createdAt: 1_000 };

describe("grouping", () => {
  it("groups consecutive messages from one sender within the window", () => {
    const messages = [
      base,
      { id: "b", senderId: "1", createdAt: 1_000 + MESSAGE_GROUP_WINDOW_MS },
      { id: "c", senderId: "1", createdAt: 1_000 + MESSAGE_GROUP_WINDOW_MS * 2 + 1 },
      { id: "d", senderId: "2", createdAt: 1_000 + MESSAGE_GROUP_WINDOW_MS * 2 + 2 },
    ];
    const runs = groupMessageRuns(messages);
    expect(runs).toHaveLength(3);
    expect(runs[0]?.messages.map((item) => item.id)).toEqual(["a", "b"]);
    expect(runs[1]?.messages.map((item) => item.id)).toEqual(["c"]);
    expect(runs[2]?.senderId).toBe("2");
  });

  it("does not group different senders or a missing neighbour", () => {
    expect(isWithinGroupWindow(base, null)).toBe(false);
    expect(isWithinGroupWindow(base, { ...base, senderId: "9" })).toBe(false);
    expect(groupMessageRuns([])).toEqual([]);
  });

  it("assigns bubble roles and tail/timestamp rules", () => {
    expect(bubbleRole(0, 0)).toBe("single");
    expect(bubbleRole(0, 1)).toBe("single");
    expect(bubbleRole(0, 3)).toBe("first");
    expect(bubbleRole(1, 3)).toBe("middle");
    expect(bubbleRole(2, 3)).toBe("last");
    expect(bubbleRole(-1, 3)).toBe("first");
    expect(showsTail("single")).toBe(true);
    expect(showsTail("last")).toBe(true);
    expect(showsTail("first")).toBe(false);
    expect(showsTimestampByDefault("middle")).toBe(false);
  });
});
