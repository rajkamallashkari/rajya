export const botKeys = {
  all: ["bots"] as const,
  list: () => [...botKeys.all, "list"] as const,
  requests: () => [...botKeys.all, "requests"] as const,
};

export const styleProfileKeys = {
  all: ["style-profile"] as const,
  current: () => [...styleProfileKeys.all, "current"] as const,
};
