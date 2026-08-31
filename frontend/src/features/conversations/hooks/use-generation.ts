import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { GenerationState } from "@/features/conversations/model/generation";
import { realtimeKeys } from "@/shared/lib/realtime/keys";

export function useGeneration(conversationId: number): GenerationState | null {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryFn: () =>
      queryClient.getQueryData<GenerationState | null>(realtimeKeys.generation(conversationId)) ??
      null,
    queryKey: realtimeKeys.generation(conversationId),
  });
  return query.data ?? null;
}
