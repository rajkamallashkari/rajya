import { useEffect } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccessSession } from "@/features/auth/model/access-session";
import { useAccountsStore } from "@/features/auth/store/accounts-store";
import { conversationKeys, folderKeys, messageKeys, reportKeys, savedReplyKeys } from "@/features/conversations/api/keys";
import {
  addConversationToFolder,
  archiveConversation,
  bulkForwardMessages,
  bulkSaveMessages,
  bulkUnsendMessages,
  closePoll,
  createFolder,
  createMessageReminder,
  createReport,
  destroyFolder,
  editMessage,
  getConversation,
  getMessage,
  getMessageInfo,
  getPoll,
  listConversations,
  listFolders,
  listMessages,
  listReactions,
  listReportReasons,
  listSavedReplies,
  markConversationRead,
  markConversationUnread,
  muteConversation,
  pinConversation,
  pinMessage,
  reactToMessage,
  removeConversationFromFolder,
  reorderFolders,
  saveMessage,
  sendMessage,
  unarchiveConversation,
  unmuteConversation,
  unpinConversation,
  unsendMessage,
  updateConversation,
  updateFolder,
  votePoll,
  type Conversation,
  type ConversationFolder,
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
import {
  hydrateConversationList,
  hydrateMessageQuery,
  persistConversationList,
  persistFetchedPage,
} from "@/features/conversations/api/persist";
import { MS_PER_SECOND } from "@/features/conversations/model/constants";
import { enqueueAndFlush } from "@/shared/lib/outbox/processor";
import { sendOutboxMessage } from "@/shared/lib/outbox/send";

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

export function useConversations(archived = false) {
  const queryClient = useQueryClient();
  const accountId = useAccountsStore((state) => state.activeAccountId);
  const key = archived ? conversationKeys.archived() : conversationKeys.list();
  useEffect(() => {
    if (accountId == null || archived) {
      return;
    }
    void hydrateConversationList(queryClient, accountId);
  }, [accountId, archived, queryClient]);
  return useQuery({
    queryFn: async () => {
      const data = await listConversations(archived);
      if (!archived) {
        persistConversationList(data);
      }
      return data;
    },
    queryKey: key,
  });
}

export function useConversation(id: number) {
  const queryClient = useQueryClient();
  return useQuery({
    queryFn: async () => {
      const data = await getConversation(id);
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
      return data;
    },
    queryKey: conversationKeys.detail(id),
  });
}

export function useMessagePage(conversationId: number) {
  const queryClient = useQueryClient();
  const accountId = useAccountsStore((state) => state.activeAccountId);
  useEffect(() => {
    if (accountId == null) {
      return;
    }
    void hydrateMessageQuery(queryClient, accountId, conversationId);
  }, [accountId, conversationId, queryClient]);
  const query = useInfiniteQuery<
    MessagePage,
    Error,
    MessagePages,
    ReturnType<typeof messageKeys.page>,
    MessagePageParam
  >({
    queryFn: async ({ pageParam }) => {
      const page = await listMessages(conversationId, pageParam);
      persistFetchedPage(conversationId, page, pageParam);
      return page;
    },
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

export function useMessagePermalink(id: number | null) {
  return useQuery({
    enabled: id != null,
    queryFn: () => getMessage(id as number),
    queryKey: messageKeys.permalink(id ?? 0),
  });
}

export function useReactionDetails(id: number | null) {
  return useQuery({
    enabled: id != null,
    queryFn: () => listReactions(id as number),
    queryKey: messageKeys.reactions(id ?? 0),
  });
}

export function useBulkUnsend(conversationId: number) {
  const queryClient = useQueryClient();
  const key = messageKeys.page(conversationId);
  return useMutation({
    mutationFn: (messageIds: number[]) => bulkUnsendMessages(messageIds),
    onMutate: async (messageIds) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MessagePages>(key);
      const selected = new Set(messageIds);
      if (previous) {
        queryClient.setQueryData(
          key,
          mapPages(previous, (message) =>
            selected.has(message.id) ? { ...message, body: null, deleted: true } : message,
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

export function useBulkSave() {
  const queryClient = useQueryClient();
  const key = messageKeys.saved();
  return useMutation({
    mutationFn: (messageIds: number[]) => bulkSaveMessages(messageIds),
    onMutate: async (messageIds) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<number[]>(key);
      queryClient.setQueryData(key, [...new Set([...(previous ?? []), ...messageIds])]);
      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(key, context?.previous ?? []);
    },
  });
}

export function useBulkForward(conversationId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageIds, targetId }: { messageIds: number[]; targetId: number }) =>
      bulkForwardMessages(messageIds, targetId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: messageKeys.page(conversationId) });
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
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

function optimisticMessage(
  conversationId: number,
  body: string,
  nonce: string,
  input: { silent?: boolean },
): Message {
  const session = getAccessSession();
  return {
    id: -Date.now(),
    conversation_id: conversationId,
    position: 0,
    revision: 0,
    kind: "text",
    body,
    deleted: false,
    silent: input.silent ?? false,
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
    mutationFn: async (input: { body: string; client_nonce: string; silent?: boolean }) => {
      const session = getAccessSession();
      if (session == null) {
        return sendMessage({ conversation_id: conversationId, ...input });
      }
      const result = await enqueueAndFlush(
        session.accountId,
        {
          body: input.body,
          conversationId,
          createdAt: new Date().toISOString(),
          id: input.client_nonce,
          silent: input.silent,
        },
        {
          send: (entry) =>
            sendOutboxMessage({
              body: entry.body,
              clientNonce: entry.id,
              conversationId: entry.conversationId,
              origin: window.location.origin,
              replyToMessageId: entry.replyToMessageId,
              silent: entry.silent,
              token: session.token,
            }),
        },
      );
      const failed = result.failed[input.client_nonce];
      if (failed === "auth" || failed === "rejected") {
        throw new Error(failed);
      }
      return result.sent[input.client_nonce] ?? null;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MessagePages>(key);
      const optimistic = optimisticMessage(conversationId, input.body, input.client_nonce, input);
      optimistic.position = newestPosition(previous) + 1;
      if (previous) {
        queryClient.setQueryData(key, appendToNewest(previous, optimistic));
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      rollbackPages(queryClient, key, context?.previous);
    },
    onSuccess: (message) => {
      if (!message) {
        return;
      }
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

function patchConversationList(
  current: { conversations: Conversation[] } | undefined,
  id: number,
  patch: Partial<Conversation>,
): { conversations: Conversation[] } | undefined {
  if (!current) {
    return current;
  }
  return {
    conversations: current.conversations.map((row) => (row.id === id ? { ...row, ...patch } : row)),
  };
}

export function usePinConversation() {
  const queryClient = useQueryClient();
  const key = conversationKeys.list();
  return useMutation({
    mutationFn: ({ id, pinned }: { id: number; pinned: boolean }) =>
      pinned ? pinConversation(id) : unpinConversation(id),
    onMutate: async ({ id, pinned }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ conversations: Conversation[] }>(key);
      queryClient.setQueryData(
        key,
        patchConversationList(previous, id, {
          pinned_at: pinned ? new Date().toISOString() : null,
        }),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useMarkConversationUnread() {
  const queryClient = useQueryClient();
  const key = conversationKeys.list();
  return useMutation({
    mutationFn: ({ id, unread }: { id: number; unread: boolean }) =>
      unread ? markConversationUnread(id) : markConversationRead(id),
    onMutate: async ({ id, unread }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ conversations: Conversation[] }>(key);
      queryClient.setQueryData(
        key,
        patchConversationList(previous, id, {
          manually_unread_at: unread ? new Date().toISOString() : null,
        }),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useSavedReplies() {
  return useQuery({
    queryFn: listSavedReplies,
    queryKey: savedReplyKeys.list(),
  });
}

export function useCreateReminder() {
  return useMutation({
    mutationFn: ({ messageId, note, remindAt }: { messageId: number; note?: string; remindAt: string }) =>
      createMessageReminder(messageId, remindAt, note),
  });
}

type ConversationList = { conversations: Conversation[] };

function removeFromList(
  current: ConversationList | undefined,
  id: number,
): ConversationList | undefined {
  if (!current) {
    return current;
  }
  return { conversations: current.conversations.filter((row) => row.id !== id) };
}

export function useArchiveConversation() {
  const queryClient = useQueryClient();
  const listKey = conversationKeys.list();
  const archivedKey = conversationKeys.archived();
  return useMutation({
    mutationFn: ({ archived, id }: { archived: boolean; id: number }) =>
      archived ? archiveConversation(id) : unarchiveConversation(id),
    onMutate: async ({ archived, id }) => {
      await queryClient.cancelQueries({ queryKey: conversationKeys.all });
      const previousList = queryClient.getQueryData<ConversationList>(listKey);
      const previousArchived = queryClient.getQueryData<ConversationList>(archivedKey);
      const stamp = new Date().toISOString();
      if (archived) {
        const row = previousList?.conversations.find((item) => item.id === id);
        queryClient.setQueryData(listKey, removeFromList(previousList, id));
        if (row) {
          queryClient.setQueryData(archivedKey, {
            conversations: [...(previousArchived?.conversations ?? []), { ...row, archived_at: stamp }],
          });
        }
      } else {
        const row = previousArchived?.conversations.find((item) => item.id === id);
        queryClient.setQueryData(archivedKey, removeFromList(previousArchived, id));
        if (row) {
          queryClient.setQueryData(listKey, {
            conversations: [{ ...row, archived_at: null }, ...(previousList?.conversations ?? [])],
          });
        }
      }
      return { previousArchived, previousList };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(listKey, context?.previousList);
      queryClient.setQueryData(archivedKey, context?.previousArchived);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
}

export function useMuteConversation() {
  const queryClient = useQueryClient();
  const key = conversationKeys.list();
  return useMutation({
    mutationFn: ({ duration, id }: { duration: number; id: number }) =>
      duration > 0 ? muteConversation(id, duration) : unmuteConversation(id),
    onMutate: async ({ duration, id }) => {
      await queryClient.cancelQueries({ queryKey: conversationKeys.list() });
      const previous = queryClient.getQueryData<ConversationList>(key);
      const previousArchived = queryClient.getQueryData<ConversationList>(
        conversationKeys.archived(),
      );
      const mutedUntil =
        duration > 0 ? new Date(Date.now() + duration * MS_PER_SECOND).toISOString() : null;
      queryClient.setQueryData(key, patchConversationList(previous, id, { muted_until: mutedUntil }));
      queryClient.setQueryData(
        conversationKeys.archived(),
        patchConversationList(previousArchived, id, { muted_until: mutedUntil }),
      );
      return { previous, previousArchived };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(key, context?.previous);
      queryClient.setQueryData(conversationKeys.archived(), context?.previousArchived);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      description?: string;
      id: number;
      member_permissions?: { [key: string]: string };
      restrict_forwarding?: boolean;
      slow_mode_seconds?: number;
      title?: string;
    }) => updateConversation(id, body),
    onSuccess: (data) => {
      queryClient.setQueryData(conversationKeys.detail(data.id), data);
    },
    onSettled: (_data, _error, input) => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.detail(input.id) });
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
}

export function useFolders() {
  return useQuery({
    queryFn: listFolders,
    queryKey: folderKeys.list(),
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createFolder(name),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: folderKeys.list() });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateFolder(id, { name }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: folderKeys.list() });
    },
  });
}

export function useDestroyFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => destroyFolder(id),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: folderKeys.list() });
    },
  });
}

export function useReorderFolders() {
  const queryClient = useQueryClient();
  const key = folderKeys.list();
  return useMutation({
    mutationFn: (ids: number[]) => reorderFolders(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ folders: ConversationFolder[] }>(key);
      if (previous) {
        const byId = new Map(previous.folders.map((folder) => [folder.id, folder]));
        queryClient.setQueryData(key, {
          folders: ids
            .map((id, position) => {
              const folder = byId.get(id);
              if (!folder) {
                return null;
              }
              return { ...folder, position };
            })
            .filter((folder): folder is ConversationFolder => folder != null),
        });
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useFolderMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      add,
      conversationId,
      folderId,
    }: {
      add: boolean;
      conversationId: number;
      folderId: number;
    }) =>
      add
        ? addConversationToFolder(folderId, conversationId)
        : removeConversationFromFolder(folderId, conversationId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: folderKeys.list() });
    },
  });
}

export function useReportReasons() {
  return useQuery({
    queryFn: listReportReasons,
    queryKey: reportKeys.reasons(),
  });
}

export function useCreateReport() {
  return useMutation({
    mutationFn: createReport,
  });
}
