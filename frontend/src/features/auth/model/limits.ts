import registry from "@/shared/lib/config/settings-registry.json";

export const PASSWORD_MIN_LENGTH = registry.password_min_length.default as number;
export const USERNAME_MIN_LENGTH = registry.username_min_length.default as number;
export const USERNAME_MAX_LENGTH = registry.username_max_length.default as number;
