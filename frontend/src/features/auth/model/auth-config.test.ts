import { describe, expect, it } from "vitest";
import { nextOnboardingStep, ONBOARDING_STEPS } from "./onboarding";
import { PASSWORD_MIN_LENGTH, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from "./limits";
import { PHONE_STATUS, PHONE_VERIFICATION_POLL_MS } from "./phone-config";
import { DEV_ACCOUNT_A_ID, DEV_ACCOUNT_B_ID } from "./dev-accounts";

describe("auth config", () => {
  it("exposes onboarding steps, limits, phone poll, and dev account ids", () => {
    expect(ONBOARDING_STEPS).toEqual(["profile", "password", "passkey"]);
    expect(nextOnboardingStep("profile")).toBe("password");
    expect(nextOnboardingStep("password")).toBe("passkey");
    expect(nextOnboardingStep("passkey")).toBeNull();
    expect(PASSWORD_MIN_LENGTH).toBeGreaterThan(0);
    expect(USERNAME_MIN_LENGTH).toBeLessThan(USERNAME_MAX_LENGTH);
    expect(PHONE_STATUS.pending).toBe("pending");
    expect(PHONE_VERIFICATION_POLL_MS).toBeGreaterThan(0);
    expect(DEV_ACCOUNT_A_ID).not.toBe(DEV_ACCOUNT_B_ID);
  });
});
