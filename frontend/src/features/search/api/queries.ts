import { useQuery } from "@tanstack/react-query";
import { searchConversation, searchGlobal, searchPeople } from "@/features/search/api/http";
import { searchKeys } from "@/features/search/api/keys";
import { SEARCH_MIN_QUERY_LENGTH } from "@/features/search/model/constants";
import { meetsMinQueryLength } from "@/features/search/model/highlight";

export function useGlobalSearch(query: string) {
  const q = query.trim();
  return useQuery({
    enabled: meetsMinQueryLength(q, SEARCH_MIN_QUERY_LENGTH),
    queryFn: () => searchGlobal(q),
    queryKey: searchKeys.global(q),
  });
}

export function useConversationSearch(conversationId: number, query: string) {
  const q = query.trim();
  return useQuery({
    enabled: meetsMinQueryLength(q, SEARCH_MIN_QUERY_LENGTH),
    queryFn: () => searchConversation(conversationId, q),
    queryKey: searchKeys.conversation(conversationId, q),
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
