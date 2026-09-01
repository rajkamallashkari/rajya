import { describe, expect, it } from "vitest";
import { displayMetric, queryListStatus } from "./display";

describe("admin display helpers", () => {
  it("stringifies primitives, blanks nulls, and json-encodes objects", () => {
    expect(displayMetric("ok")).toBe("ok");
    expect(displayMetric(3)).toBe("3");
    expect(displayMetric(true)).toBe("true");
    expect(displayMetric(null)).toBe("");
    expect(displayMetric(undefined)).toBe("");
    expect(displayMetric({ nested: true })).toBe(JSON.stringify({ nested: true }));
  });

  it("maps list query status", () => {
    expect(queryListStatus(true, false, true)).toBe("loading");
    expect(queryListStatus(false, true, true)).toBe("error");
    expect(queryListStatus(false, false, true)).toBe("empty");
    expect(queryListStatus(false, false, false)).toBe("ready");
  });
});
