import registry from "@/shared/lib/config/settings-registry.json";

export const AVATAR_ALLOWED_TYPES = ["image/gif", "image/jpeg", "image/png", "image/webp"];
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const OTP_LENGTH = registry.otp_length.default as number;
export const PASSWORD_MIN_LENGTH = registry.password_min_length.default as number;
export const USERNAME_AVAILABILITY_DEBOUNCE_MS = 400;
export const USERNAME_FORMAT = /^[a-z0-9_.]+$/;
export const USERNAME_MIN_LENGTH = registry.username_min_length.default as number;
export const USERNAME_MAX_LENGTH = registry.username_max_length.default as number;
