import { apiClient, bearerHeaders, unwrap } from "@/features/auth/api/http";
import { toSearchQueryParams, type SearchFilters } from "@/features/search/model/filters";
import type { components } from "@/shared/lib/api/schema";

export type GlobalSearch = components["schemas"]["GlobalSearch"];
export type ConversationSearch = components["schemas"]["ConversationSearch"];
export type AccountSearch = components["schemas"]["AccountSearch"];
export type SearchMessageHit = components["schemas"]["SearchMessageHit"];

export async function searchGlobal(q: string, filters: SearchFilters = {}) {
  return unwrap(
    await apiClient().GET("/api/v1/search", {
      headers: bearerHeaders(),
      params: { query: { q, ...toSearchQueryParams(filters) } },
    }),
    "search_failed",
  );
}

export async function searchConversation(
  conversationId: number,
  q: string,
  filters: SearchFilters = {},
) {
  return unwrap(
    await apiClient().GET("/api/v1/conversations/{id}/search", {
      headers: bearerHeaders(),
      params: { path: { id: conversationId }, query: { q, ...toSearchQueryParams(filters) } },
    }),
    "search_failed",
  );
}

export async function searchPeople(q: string) {
  return unwrap(
    await apiClient().GET("/api/v1/accounts/search", {
      headers: bearerHeaders(),
      params: { query: { q } },
    }),
    "search_failed",
  );
}
