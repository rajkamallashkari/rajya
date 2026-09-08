import { describe, expect, it } from "vitest";
import { visibleProfileContacts } from "./self-profile";

describe("visibleProfileContacts", () => {
  it("hides email and phone unless the matching privacy flag is on", () => {
    expect(
      visibleProfileContacts({
        email: "ada@example.com",
        phone: "+1",
        showEmail: false,
        showPhone: false,
      }),
    ).toEqual({ email: null, phone: null });
    expect(
      visibleProfileContacts({
        email: "ada@example.com",
        phone: "+1",
        showEmail: true,
        showPhone: true,
      }),
    ).toEqual({ email: "ada@example.com", phone: "+1" });
    expect(
      visibleProfileContacts({
        email: "",
        phone: null,
        showEmail: true,
        showPhone: true,
      }),
    ).toEqual({ email: null, phone: null });
  });
});
