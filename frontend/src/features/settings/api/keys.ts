export const preferenceKeys = {
  all: ["preferences"] as const,
  document: () => [...preferenceKeys.all, "document"] as const,
};

export const fontConfigKeys = {
  list: () => ["font-configs"] as const,
};

export const accentConfigKeys = {
  list: () => ["accent-configs"] as const,
};

export const sessionKeys = {
  list: () => ["device-sessions"] as const,
};

export const nicknameKeys = {
  list: () => ["contact-nicknames"] as const,
};

export const exportJobKeys = {
  list: () => ["export-jobs"] as const,
};

export const savedMessageKeys = {
  list: () => ["saved-messages"] as const,
};

export const scheduledMessageKeys = {
  list: () => ["scheduled-messages"] as const,
};

export const passkeyKeys = {
  list: () => ["passkeys"] as const,
};

export const blockKeys = {
  list: () => ["blocks"] as const,
};
