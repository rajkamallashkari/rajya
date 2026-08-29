/** Client poll while Cable phone-confirm push is still P4.1. */
export const PHONE_VERIFICATION_POLL_MS = 2_000;

export const PHONE_STATUS = {
  none: "none",
  pending: "pending",
  confirmed: "confirmed",
  expired: "expired",
} as const;

export type PhoneStatus = (typeof PHONE_STATUS)[keyof typeof PHONE_STATUS];
