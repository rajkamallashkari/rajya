export const realtimeKeys = {
  me: ["me"] as const,
  presence: (accountId: number) => ["presence", accountId] as const,
  reminders: ["reminders"] as const,
  typing: (conversationId: number) => ["typing", conversationId] as const,
  generation: (conversationId: number) => ["generation", conversationId] as const,
};
