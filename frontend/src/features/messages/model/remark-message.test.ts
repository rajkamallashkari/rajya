import { describe, expect, it } from "vitest";
import type { PhrasingContent } from "mdast";
import { messageRehypeHandlers, splitMentions, splitSpoilers } from "./remark-message";
import { schemaAttributeList } from "./sanitize-schema";

function isCustomInline(part: PhrasingContent, type: string): boolean {
  return (part as { type: string }).type === type;
}

describe("inline token splitters", () => {
  it("splits spoilers and leaves unmatched text", () => {
    expect(splitSpoilers("plain")).toEqual([{ type: "text", value: "plain" }]);
    expect(splitSpoilers("||only||").some((part) => isCustomInline(part, "spoiler"))).toBe(true);
    const parts = splitSpoilers("a ||hid|| b ||c||d");
    expect(parts.some((part) => isCustomInline(part, "spoiler"))).toBe(true);
    expect(parts[0]).toEqual({ type: "text", value: "a " });
  });

  it("splits mentions at the start and after whitespace", () => {
    expect(splitMentions("plain")).toEqual([{ type: "text", value: "plain" }]);
    const start = splitMentions("@ada hi");
    expect(start.some((part) => "handle" in part && part.handle === "ada")).toBe(true);
    const mid = splitMentions("hi @bob.");
    expect(mid.some((part) => "handle" in part && part.handle === "bob")).toBe(true);
  });

  it("covers empty spoiler capture, missing mention handle, and empty schema attrs", () => {
    const empty = splitSpoilers("||||");
    expect(empty.some((part) => isCustomInline(part, "spoiler"))).toBe(true);
    const all = { all: () => [] };
    expect(messageRehypeHandlers.mention(all, {}).properties.dataMention).toBe("");
    expect(messageRehypeHandlers.spoiler(all, {}).tagName).toBe("span");
    expect(schemaAttributeList(undefined, "a")).toEqual([]);
    expect(schemaAttributeList({ a: ["href"] }, "a")).toEqual(["href"]);
    expect(schemaAttributeList({ a: 1 as unknown as string[] }, "a")).toEqual([]);
  });
});
