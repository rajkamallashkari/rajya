export const searchKeys = {
  all: ["search"] as const,
  global: (q: string) => [...searchKeys.all, "global", q] as const,
  conversation: (conversationId: number, q: string) =>
    [...searchKeys.all, "conversation", conversationId, q] as const,
  people: (q: string) => [...searchKeys.all, "people", q] as const,
};
