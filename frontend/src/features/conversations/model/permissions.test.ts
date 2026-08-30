import { describe, expect, it } from "vitest";
import {
  conversationPermissionDefaults,
  minRoleFor,
  MEMBER_PERMISSION_KEYS,
} from "./permissions";

describe("conversation permission defaults", () => {
  it("treats a missing key as member and ships owner-open defaults", () => {
    expect(minRoleFor({}, "send_messages")).toBe("member");
    expect(minRoleFor({ send_messages: "admin" }, "send_messages")).toBe("admin");
    expect(minRoleFor({ send_messages: "ghost" }, "send_messages")).toBe("member");
    expect(conversationPermissionDefaults().slow_mode_seconds).toBe(0);
    expect(conversationPermissionDefaults().permissions.send_messages).toBe(true);
    expect(MEMBER_PERMISSION_KEYS).toContain("mention_everyone");
  });
});
