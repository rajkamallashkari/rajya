import { describe, expect, it } from "vitest";
import {
  ADMIN_SURFACE_ALL,
  contrastFailurePair,
  formField,
  parseAccountIds,
  parseSettingInput,
} from "./config";

describe("admin config helpers", () => {
  it("parses account ids and setting values", () => {
    expect(parseAccountIds("1, 2\n0 -1 x")).toEqual([1, 2]);
    expect(formField(new FormData(), "value")).toBe("");
    const filled = new FormData();
    filled.set("value", "ok");
    expect(formField(filled, "value")).toBe("ok");
    expect(parseSettingInput("integer", "15")).toBe(15);
    expect(parseSettingInput("float", "1.5")).toBe(1.5);
    expect(parseSettingInput("boolean", "true")).toBe(true);
    expect(parseSettingInput("boolean", "false")).toBe(false);
    expect(parseSettingInput("array", "[1]")).toEqual([1]);
    expect(parseSettingInput("object", '{"a":1}')).toEqual({ a: 1 });
    expect(parseSettingInput("object", "{")).toBe("{");
    expect(parseSettingInput("string", "keep")).toBe("keep");
    expect(ADMIN_SURFACE_ALL).toBe("all");
  });

  it("extracts a contrast pair from nested API errors", () => {
    expect(contrastFailurePair(undefined)).toBeUndefined();
    expect(contrastFailurePair("nope")).toBeUndefined();
    expect(
      contrastFailurePair({
        details: { pair: { against: "--surface-app", token: "--text-primary" } },
      }),
    ).toEqual({ against: "--surface-app", token: "--text-primary" });
    expect(
      contrastFailurePair({
        error: {
          details: { pair: { against: "--surface-app", token: "--text-primary" } },
        },
      }),
    ).toEqual({ against: "--surface-app", token: "--text-primary" });
    expect(contrastFailurePair({ details: { pair: { token: "t", against: 1 } } })).toBeUndefined();
    expect(contrastFailurePair({ error: { details: {} } })).toBeUndefined();
    expect(contrastFailurePair({ details: 1, error: "nope" })).toBeUndefined();
    expect(
      contrastFailurePair({
        details: 1,
        error: { details: { pair: { against: "--surface-app", token: "--text-primary" } } },
      }),
    ).toEqual({ against: "--surface-app", token: "--text-primary" });
  });
});
