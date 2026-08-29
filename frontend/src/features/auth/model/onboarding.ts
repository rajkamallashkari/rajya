export const ONBOARDING_STEPS = ["profile", "password", "passkey"] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export function nextOnboardingStep(step: OnboardingStep): OnboardingStep | null {
  if (step === "profile") {
    return "password";
  }
  if (step === "password") {
    return "passkey";
  }
  return null;
}
