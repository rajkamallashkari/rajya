export const callKeys = {
  all: ["calls"] as const,
  log: () => [...callKeys.all, "log"] as const,
};
