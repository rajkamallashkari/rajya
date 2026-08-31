import { useQuery } from "@tanstack/react-query";
import { searchConversation, searchGlobal, searchPeople } from "@/features/search/api/http";
import { searchKeys } from "@/features/search/api/keys";
import { SEARCH_MIN_QUERY_LENGTH } from "@/features/search/model/constants";
import { filtersActive, type SearchFilters } from "@/features/search/model/filters";
import { meetsMinQueryLength } from "@/features/search/model/highlight";

function searchEnabled(query: string, filters: SearchFilters): boolean {
  return meetsMinQueryLength(query, SEARCH_MIN_QUERY_LENGTH) || filtersActive(filters);
}

export function useGlobalSearch(query: string, filters: SearchFilters = {}) {
  const q = query.trim();
  return useQuery({
    enabled: searchEnabled(q, filters),
    queryFn: () => searchGlobal(q, filters),
    queryKey: searchKeys.global(q, filters),
  });
}

export function useConversationSearch(
  conversationId: number,
  query: string,
  filters: SearchFilters = {},
) {
  const q = query.trim();
  return useQuery({
    enabled: searchEnabled(q, filters),
    queryFn: () => searchConversation(conversationId, q, filters),
    queryKey: searchKeys.conversation(conversationId, q, filters),
  });
}

export function usePeopleSearch(query: string) {
  const q = query.trim();
  return useQuery({
    enabled: meetsMinQueryLength(q, SEARCH_MIN_QUERY_LENGTH),
    queryFn: () => searchPeople(q),
    queryKey: searchKeys.people(q),
  });
}
