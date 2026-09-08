import { describe, expect, it } from "vitest";
import {
  GIS_SCOPE,
  GIS_SCRIPT_SRC,
  googleClientId,
  googleSignInEnabled,
  magicLinkToken,
} from "./gate-config";

describe("auth gate config", () => {
  it("hides Google when the Vite client id is unset or blank", () => {
    expect(googleClientId({})).toBe("");
    expect(googleSignInEnabled({})).toBe(false);
    expect(googleClientId({ VITE_GOOGLE_CLIENT_ID: "  " })).toBe("");
    expect(googleSignInEnabled({ VITE_GOOGLE_CLIENT_ID: " abc.apps.googleusercontent.com " })).toBe(
      true,
    );
    expect(googleClientId({ VITE_GOOGLE_CLIENT_ID: " abc.apps.googleusercontent.com " })).toBe(
      "abc.apps.googleusercontent.com",
    );
    expect(GIS_SCRIPT_SRC).toContain("accounts.google.com");
    expect(GIS_SCOPE).toContain("openid");
  });

  it("reads a magic-link token only on the mailer path", () => {
    expect(magicLinkToken("/", "?token=abc")).toBeNull();
    expect(magicLinkToken("/auth/magic", "")).toBeNull();
    expect(magicLinkToken("/auth/magic", "?token=")).toBeNull();
    expect(magicLinkToken("/auth/magic", "?token=%20")).toBeNull();
    expect(magicLinkToken("/auth/magic", "?token=tok")).toBe("tok");
  });
});
