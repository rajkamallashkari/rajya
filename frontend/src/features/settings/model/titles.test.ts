import { describe, expect, it } from "vitest";
import { settingsPanelTitleKey } from "./titles";

describe("settingsPanelTitleKey", () => {
  it("maps hub, stickers, and section ids", () => {
    expect(settingsPanelTitleKey("hub")).toBe("shell.settings");
    expect(settingsPanelTitleKey("stickers")).toBe("settings.sticker_packs.title");
    expect(settingsPanelTitleKey("display")).toBe("settings.display");
    expect(settingsPanelTitleKey("accounts")).toBe("settings.accounts");
  });
});
