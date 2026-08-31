import { describe, expect, it } from "vitest";
import { applyFont, FONT_LINK_ID, withFontDisplaySwap } from "./fonts";

describe("fonts", () => {
  it("appends display=swap and injects a single stylesheet link", () => {
    expect(withFontDisplaySwap("https://fonts.example/css")).toContain("display=swap");
    expect(withFontDisplaySwap("https://fonts.example/css?family=Inter")).toContain("&display=swap");
    expect(withFontDisplaySwap("https://fonts.example/css?display=swap")).toBe(
      "https://fonts.example/css?display=swap",
    );
    document.head.innerHTML = "";
    applyFont(document, "Inter, sans-serif", "https://fonts.example/css");
    expect(document.getElementById(FONT_LINK_ID)?.getAttribute("href")).toContain("display=swap");
    applyFont(document, "Inter, sans-serif", "https://fonts.example/css?family=Inter");
    expect(document.querySelectorAll(`#${FONT_LINK_ID}`)).toHaveLength(1);
    applyFont(document, "inherit", null);
    expect(document.getElementById(FONT_LINK_ID)).toBeNull();
    const stray = document.createElement("span");
    stray.id = FONT_LINK_ID;
    document.head.append(stray);
    applyFont(document, "Inter, sans-serif", "https://fonts.example/css?display=swap");
    expect(document.getElementById(FONT_LINK_ID)?.tagName).toBe("LINK");
    applyFont({ documentElement: document.documentElement } as unknown as Document, "inherit", null);
  });
});
