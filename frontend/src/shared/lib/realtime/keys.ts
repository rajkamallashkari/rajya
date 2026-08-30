export const realtimeKeys = {
  me: ["me"] as const,
  presence: (accountId: number) => ["presence", accountId] as const,
  reminders: ["reminders"] as const,
};
