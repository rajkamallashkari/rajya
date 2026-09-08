import { describe, expect, it } from "vitest";
import {
  botMatchesComposeQuery,
  COMPOSE_AT,
  composeSearchNeedle,
  composeUsernameOnly,
  enoughGroupMembers,
} from "./compose";

const nimbus = {
  id: 1,
  memory_enabled: true,
  account: { id: 99, username: "nimbus", display_name: "Nimbus", kind: "bot" },
};

describe("compose search", () => {
  it("strips at-signs, matches bots, and counts group members with the creator", () => {
    expect(composeSearchNeedle("  Ada  ")).toBe("Ada");
    expect(composeSearchNeedle(`${COMPOSE_AT}ada`)).toBe("ada");
    expect(composeUsernameOnly(`${COMPOSE_AT}nimbus`)).toBe(true);
    expect(composeUsernameOnly("Nimbus")).toBe(false);
    expect(botMatchesComposeQuery(nimbus, "")).toBe(true);
    expect(botMatchesComposeQuery(nimbus, "nim")).toBe(true);
    expect(botMatchesComposeQuery(nimbus, "Nimbus")).toBe(true);
    expect(botMatchesComposeQuery(nimbus, `${COMPOSE_AT}nim`)).toBe(true);
    expect(botMatchesComposeQuery(nimbus, `${COMPOSE_AT}zzz`)).toBe(false);
    expect(botMatchesComposeQuery(nimbus, "zzz")).toBe(false);
    expect(enoughGroupMembers(0, 2)).toBe(false);
    expect(enoughGroupMembers(1, 2)).toBe(true);
  });
});
