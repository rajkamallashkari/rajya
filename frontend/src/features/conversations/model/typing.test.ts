import { describe, expect, it } from "vitest";
import {
  expireTypingEntries,
  isActivityKind,
  removeTypist,
  typingLabelKey,
  upsertTypingEntry,
  type TypingEntry,
} from "./typing";

function entry(accountId: number, extras: Partial<TypingEntry> = {}): TypingEntry {
  return {
    accountId,
    activity: "typing",
    displayName: "Ada",
    expiresAt: 10,
    ...extras,
  };
}

describe("typing model", () => {
  it("upserts, expires, removes, and labels activity kinds", () => {
    expect(isActivityKind("typing")).toBe(true);
    expect(isActivityKind("dancing")).toBe(false);
    const kept = upsertTypingEntry([entry(1, { expiresAt: 5 })], entry(2, { expiresAt: 20 }), 10);
    expect(kept.map((row) => row.accountId)).toEqual([2]);
    const replaced = upsertTypingEntry([entry(2, { expiresAt: 20 })], entry(2, { activity: "recording_audio", expiresAt: 30 }), 10);
    expect(replaced).toEqual([entry(2, { activity: "recording_audio", expiresAt: 30 })]);
    expect(expireTypingEntries([entry(1, { expiresAt: 5 }), entry(2, { expiresAt: 15 })], 10)).toEqual([
      entry(2, { expiresAt: 15 }),
    ]);
    expect(removeTypist([entry(1, { expiresAt: 20 }), entry(2, { expiresAt: 20 })], 1, 10)).toEqual([
      entry(2, { expiresAt: 20 }),
    ]);
    expect(typingLabelKey([])).toBe("typing");
    expect(typingLabelKey([entry(1, { activity: "uploading_file" })])).toBe("uploading_file");
  });
});
