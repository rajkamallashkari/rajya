import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccessSession } from "@/features/auth/model/access-session";
import { expireTypingEntries, type TypingEntry } from "@/features/conversations/model/typing";
import { realtimeKeys } from "@/shared/lib/realtime/keys";

export function useTypingIndicators(conversationId: number): TypingEntry[] {
  const queryClient = useQueryClient();
  const viewerId = getAccessSession()?.accountId;
  const query = useQuery({
    queryFn: () => queryClient.getQueryData<TypingEntry[]>(realtimeKeys.typing(conversationId)) ?? [],
    queryKey: realtimeKeys.typing(conversationId),
  });
  const live = useMemo(
    () => expireTypingEntries(query.data ?? [], Date.now()).filter((entry) => entry.accountId !== viewerId),
    [query.data, viewerId],
  );

  useEffect(() => {
    const nextExpiry = live.reduce((soonest, entry) => Math.min(soonest, entry.expiresAt), Number.POSITIVE_INFINITY);
    if (!Number.isFinite(nextExpiry)) {
      return;
    }
    const delay = Math.max(nextExpiry - Date.now(), 0);
    const timer = setTimeout(() => {
      queryClient.setQueryData(realtimeKeys.typing(conversationId), (current: TypingEntry[]) =>
        expireTypingEntries(current, Date.now()),
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [conversationId, live, queryClient]);

  return live;
}
