import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccessSession } from "@/features/auth/model/access-session";
import { conversationKeys, messageKeys } from "@/features/conversations/api/keys";
import {
  closePoll,
  editMessage,
  getConversation,
  getMessageInfo,
  getPoll,
  listConversations,
  listMessages,
  pinMessage,
  reactToMessage,
  saveMessage,
  sendMessage,
  unsendMessage,
  votePoll,
  type Message,
  type MessagePage,
} from "@/features/conversations/api/http";
import {
  appendToNewest,
  flattenMessages,
  mapPages,
  restorePages,
  type MessagePages,
} from "@/features/conversations/api/cache";

type MessagePageParam = { after?: number; before?: number };

export function olderPageParam(lastPage: MessagePage): MessagePageParam | undefined {
  if (!lastPage.meta.has_more_before || lastPage.meta.oldest_position == null) {
    return undefined;
  }
  return { before: lastPage.meta.oldest_position };
}

export function newerPageParam(firstPage: MessagePage): MessagePageParam | undefined {
  if (!firstPage.meta.has_more_after || firstPage.meta.newest_position == null) {
    return undefined;
  }
  return { after: firstPage.meta.newest_position };
}

export function useConversations() {
  return useQuery({
    queryFn: listConversations,
    queryKey: conversationKeys.list(),
  });
}

export function useConversation(id: number) {
  return useQuery({
    queryFn: () => getConversation(id),
    queryKey: conversationKeys.detail(id),
  });
}

export function useMessagePage(conversationId: number) {
  const query = useInfiniteQuery<
    MessagePage,
    Error,
    MessagePages,
    ReturnType<typeof messageKeys.page>,
    MessagePageParam
  >({
    queryFn: ({ pageParam }) => listMessages(conversationId, pageParam),
    queryKey: messageKeys.page(conversationId),
    initialPageParam: {},
    getNextPageParam: olderPageParam,
    getPreviousPageParam: newerPageParam,
  });
  return { ...query, messages: flattenMessages(query.data) };
}

export function useJumpToMessage(
  conversationId: number,
  target: { at?: string; messageId?: number },
) {
  return useQuery({
    enabled: target.messageId != null || Boolean(target.at),
    queryFn: () =>
      listMessages(conversationId, { around_id: target.messageId, around_at: target.at }),
    queryKey: messageKeys.around(conversationId, target),
  });
}

export function useMessageInfo(id: number | null) {
  return useQuery({
    enabled: id != null,
    queryFn: () => getMessageInfo(id as number),
    queryKey: messageKeys.info(id ?? 0),
  });
}

function newestPosition(data: MessagePages | undefined): number {
  const last = flattenMessages(data).at(-1);
  return last?.position ?? 0;
}

function rollbackPages(
  queryClient: ReturnType<typeof useQueryClient>,
  key: readonly unknown[],
  previous: MessagePages | undefined,
): void {
  const restored = restorePages(previous);
  if (restored) {
    queryClient.setQueryData(key, restored);
  }
}

function optimisticMessage(conversationId: number, body: string, nonce: string): Message {
  const session = getAccessSession();
  return {
    id: -Date.now(),
    conversation_id: conversationId,
    position: 0,
    revision: 0,
    kind: "text",
    body,
    deleted: false,
    client_nonce: nonce,
    created_at: new Date().toISOString(),
    sender: session
      ? {
          id: session.accountId,
          username: session.username,
          display_name: session.displayName,
          kind: "human",
        }
      : undefined,
  };
}

export function useSendMessage(conversationId: number) {
  const queryClient = useQueryClient();
  const key = messageKeys.page(conversationId);
  return useMutation({
    mutationFn: (input: { body: string; client_nonce: string }) =>
      sendMessage({ conversation_id: conversationId, ...input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MessagePages>(key);
      const optimistic = optimisticMessage(conversationId, input.body, input.client_nonce);
      optimistic.position = newestPosition(previous) + 1;
      if (previous) {
        queryClient.setQueryData(key, appendToNewest(previous, optimistic));
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      rollbackPages(queryClient, key, context?.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
}

export function useEditMessage(conversationId: number) {
  const queryClient = useQueryClient();
  const key = messageKeys.page(conversationId);
  return useMutation({
    mutationFn: ({ body, id }: { body: string; id: number }) => editMessage(id, body),
    onMutate: async ({ body, id }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MessagePages>(key);
      if (previous) {
        queryClient.setQueryData(
          key,
          mapPages(previous, (message) => (message.id === id ? { ...message, body } : message)),
        );
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      rollbackPages(queryClient, key, context?.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useReactMessage(conversationId: number) {
  const queryClient = useQueryClient();
  const key = messageKeys.page(conversationId);
  return useMutation({
    mutationFn: ({ emoji, id }: { emoji: string; id: number }) => reactToMessage(id, emoji),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MessagePages>(key);
      if (previous) {
        queryClient.setQueryData(
          key,
          mapPages(previous, (message) =>
            message.id === id ? { ...message, revision: message.revision + 1 } : message,
          ),
        );
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      rollbackPages(queryClient, key, context?.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function usePinMessage(conversationId: number) {
  const queryClient = useQueryClient();
  const key = messageKeys.pinned(conversationId);
  return useMutation({
    mutationFn: (messageId: number) => pinMessage(conversationId, messageId),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<number[]>(key);
      queryClient.setQueryData(key, [...(previous ?? []), messageId]);
      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(key, context?.previous ?? []);
    },
  });
}

export function useSaveMessage() {
  const queryClient = useQueryClient();
  const key = messageKeys.saved();
  return useMutation({
    mutationFn: (messageId: number) => saveMessage(messageId),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<number[]>(key);
      queryClient.setQueryData(key, [...(previous ?? []), messageId]);
      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(key, context?.previous ?? []);
    },
  });
}

export function useUnsendMessage(conversationId: number) {
  const queryClient = useQueryClient();
  const key = messageKeys.page(conversationId);
  return useMutation({
    mutationFn: (id: number) => unsendMessage(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MessagePages>(key);
      if (previous) {
        queryClient.setQueryData(
          key,
          mapPages(previous, (message) =>
            message.id === id ? { ...message, body: null, deleted: true } : message,
          ),
        );
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      rollbackPages(queryClient, key, context?.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useVotePoll(conversationId: number) {
  const queryClient = useQueryClient();
  const key = messageKeys.page(conversationId);
  return useMutation({
    mutationFn: ({ optionIds, pollId }: { optionIds: number[]; pollId: number }) =>
      votePoll(pollId, optionIds),
    onMutate: async ({ optionIds, pollId }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MessagePages>(key);
      if (previous) {
        queryClient.setQueryData(
          key,
          mapPages(previous, (message) => withPollVote(message, pollId, optionIds)),
        );
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      rollbackPages(queryClient, key, context?.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useClosePoll(conversationId: number) {
  const queryClient = useQueryClient();
  const key = messageKeys.page(conversationId);
  return useMutation({
    mutationFn: (pollId: number) => closePoll(pollId),
    onMutate: async (pollId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MessagePages>(key);
      if (previous) {
        queryClient.setQueryData(
          key,
          mapPages(previous, (message) => withPollClosed(message, pollId)),
        );
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      rollbackPages(queryClient, key, context?.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function usePollResults(pollId: number | null) {
  return useQuery({
    enabled: pollId != null,
    queryFn: () => getPoll(pollId as number),
    queryKey: messageKeys.poll(pollId ?? 0),
  });
}

function withPollVote(message: Message, pollId: number, optionIds: number[]): Message {
  const poll = message.poll;
  if (poll?.id !== pollId) {
    return message;
  }
  const selected = new Set(optionIds);
  return {
    ...message,
    poll: {
      ...poll,
      options: poll.options.map((option) => ({
        ...option,
        selected: selected.has(option.id),
      })),
    },
  };
}

function withPollClosed(message: Message, pollId: number): Message {
  const poll = message.poll;
  if (poll?.id !== pollId) {
    return message;
  }
  return { ...message, poll: { ...poll, closed: true } };
}

export async function emptyIdList(): Promise<number[]> {
  return [];
}

export function usePinnedIds(conversationId: number) {
  return useQuery({
    queryFn: emptyIdList,
    queryKey: messageKeys.pinned(conversationId),
    staleTime: Infinity,
    initialData: [] as number[],
  });
}

export function useSavedIds() {
  return useQuery({
    queryFn: emptyIdList,
    queryKey: messageKeys.saved(),
    staleTime: Infinity,
    initialData: [] as number[],
  });
}

export type { MessagePage };
