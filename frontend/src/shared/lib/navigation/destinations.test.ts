import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHELL_DESTINATION,
  SHELL_DESTINATIONS,
  shouldHideMobileTabBar,
} from "./destinations";

describe("shell destinations", () => {
  it("lists exclusive tabs in order", () => {
    expect(SHELL_DESTINATIONS).toEqual(["chats", "calls", "profile"]);
    expect(DEFAULT_SHELL_DESTINATION).toBe("chats");
  });

  it("hides the mobile bar only for nested Chats surfaces", () => {
    expect(shouldHideMobileTabBar({ destination: "chats", layerCount: 1, mobile: true })).toBe(
      true,
    );
    expect(shouldHideMobileTabBar({ destination: "chats", layerCount: 0, mobile: true })).toBe(
      false,
    );
    expect(shouldHideMobileTabBar({ destination: "calls", layerCount: 2, mobile: true })).toBe(
      false,
    );
    expect(shouldHideMobileTabBar({ destination: "chats", layerCount: 1, mobile: false })).toBe(
      false,
    );
  });
});
