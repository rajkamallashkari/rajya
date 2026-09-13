import { describe, expect, it } from "vitest";
import {
  formatPreferenceCompact,
  formatPreferenceDate,
  formatPreferenceDateTime,
  formatPreferenceTime,
} from "./date-time";

const STAMP = new Date(2026, 7, 27, 15, 4);

describe("preference date and time formatting", () => {
  it("honors numeric date order and 24-hour time", () => {
    const preferences = { dateFormat: "DD/MM/YYYY" as const, timeFormat: "24h" as const };
    expect(formatPreferenceDate(STAMP, "en-GB", preferences)).toBe("27/08/2026");
    expect(formatPreferenceTime(STAMP, "en-GB", preferences)).toMatch(/^15:04$/);
    expect(formatPreferenceDateTime(STAMP, "en-GB", preferences)).toBe("27/08/2026, 15:04");
  });

  it("honors textual date order and 12-hour time", () => {
    const preferences = { dateFormat: "MMM D, YYYY" as const, timeFormat: "12h" as const };
    expect(formatPreferenceDate(STAMP, "en-US", preferences)).toBe("Aug 27, 2026");
    expect(formatPreferenceTime(STAMP, "en-US", preferences)).toMatch(/3:04 PM/);
  });

  it.each([
    ["YYYY-MM-DD", "2026-08-27"],
    ["MM/DD/YYYY", "08/27/2026"],
    ["DD/MM/YYYY", "27/08/2026"],
    ["DD-MM-YYYY", "27-08-2026"],
    ["MMM D, YYYY", "Aug 27, 2026"],
    ["D MMM YYYY", "27 Aug 2026"],
    ["MMMM D, YYYY", "August 27, 2026"],
    ["D MMMM YYYY", "27 August 2026"],
    ["ddd, MMM D, YYYY", "Thu, Aug 27, 2026"],
    ["MM.DD.YYYY", "08.27.2026"],
    ["DD.MM.YYYY", "27.08.2026"],
  ] as const)("formats the %s date preference", (dateFormat, expected) => {
    expect(
      formatPreferenceDate(STAMP, "en-US", { dateFormat, timeFormat: "12h" }),
    ).toBe(expected);
  });

  it("uses time today and the preferred date otherwise for compact labels", () => {
    const preferences = { dateFormat: "YYYY-MM-DD" as const, timeFormat: "24h" as const };
    expect(formatPreferenceCompact(STAMP, "en-GB", preferences, STAMP)).toBe("15:04");
    expect(formatPreferenceCompact(STAMP, "en-GB", preferences, new Date(2026, 7, 28))).toBe(
      "2026-08-27",
    );
  });
});
