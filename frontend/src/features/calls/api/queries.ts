import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { listCalls, type CallList } from "@/features/calls/api/http";
import { callKeys } from "@/features/calls/api/keys";
import { CALL_LOG_FIRST_PAGE } from "@/features/calls/model/constants";

export function useCallLog() {
  return useInfiniteQuery<
    CallList,
    Error,
    InfiniteData<CallList>,
    ReturnType<typeof callKeys.log>,
    number
  >({
    getNextPageParam: (lastPage) => (lastPage.meta.has_more ? lastPage.meta.page + 1 : undefined),
    initialPageParam: CALL_LOG_FIRST_PAGE,
    queryFn: ({ pageParam }) => listCalls(pageParam),
    queryKey: callKeys.log(),
  });
}
