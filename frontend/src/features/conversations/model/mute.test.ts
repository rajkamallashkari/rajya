import { describe, expect, it } from "vitest";
import { muteDurationOptions } from "./mute";
import { MUTE_DURATIONS } from "./settings";

describe("mute durations", () => {
  it("maps each configured duration to a catalog key", () => {
    const options = muteDurationOptions();
    expect(options.map((option) => option.seconds)).toEqual(MUTE_DURATIONS);
    expect(options[0]?.labelKey).toBe("conversations.mute_1h");
    expect(options.at(-1)?.labelKey).toBe("conversations.mute_until_on");
  });
});
