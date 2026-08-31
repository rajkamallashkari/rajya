import { serializeFilters, type SearchFilters } from "@/features/search/model/filters";

export const searchKeys = {
  all: ["search"] as const,
  global: (q: string, filters: SearchFilters) =>
    [...searchKeys.all, "global", q, serializeFilters(filters)] as const,
  conversation: (conversationId: number, q: string, filters: SearchFilters) =>
    [...searchKeys.all, "conversation", conversationId, q, serializeFilters(filters)] as const,
  people: (q: string) => [...searchKeys.all, "people", q] as const,
};
