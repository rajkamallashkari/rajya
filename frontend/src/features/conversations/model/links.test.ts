import { describe, expect, it } from "vitest";
import { canEditInfo, canManageInvites, inviteUrl, profileUrl } from "./links";

describe("conversation links", () => {
  it("builds URLs and gates invite management and info edits", () => {
    expect(inviteUrl("https://rajya.pages.dev", "ab/c")).toBe("https://rajya.pages.dev/invite/ab%2Fc");
    expect(profileUrl("https://rajya.pages.dev", "ada")).toBe("https://rajya.pages.dev/u/ada");
    expect(canManageInvites("group", "owner")).toBe(true);
    expect(canManageInvites("direct", "owner")).toBe(false);
    expect(canEditInfo("group", "admin")).toBe(true);
    expect(canEditInfo("group", "admin", false)).toBe(false);
    expect(canEditInfo("direct", "owner")).toBe(false);
    expect(canEditInfo("group", "member")).toBe(false);
  });
});
