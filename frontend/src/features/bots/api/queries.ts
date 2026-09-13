import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  buildStyleProfile,
  createBotRequest,
  deactivateBot,
  getStyleProfile,
  listBotRequests,
  listBots,
  listOwnedBots,
  rewriteDraft,
  suggestReplies,
  summarizeConversation,
  translateMessage,
  updateBotRequest,
  updateStyleConsent,
  withdrawBotRequest,
} from "@/features/bots/api/http";
import { botKeys, styleProfileKeys } from "@/features/bots/api/keys";
import { createConversation } from "@/features/conversations/api/http";
import { conversationKeys } from "@/features/conversations/api/keys";

export function useBots() {
  return useQuery({
    queryFn: listBots,
    queryKey: botKeys.list(),
  });
}

export function useOwnedBots() {
  return useQuery({
    queryFn: listOwnedBots,
    queryKey: botKeys.owned(),
  });
}

export function useBotRequests() {
  return useQuery({
    queryFn: listBotRequests,
    queryKey: botKeys.requests(),
  });
}

export function useCreateBotRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBotRequest,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: botKeys.requests() });
    },
  });
}

export function useUpdateBotRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ body, id }: { body: Parameters<typeof updateBotRequest>[1]; id: number }) =>
      updateBotRequest(id, body),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: botKeys.requests() });
    },
  });
}

export function useWithdrawBotRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: withdrawBotRequest,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: botKeys.requests() });
    },
  });
}

export function useDeactivateBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateBot,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: botKeys.owned() });
      void queryClient.invalidateQueries({ queryKey: botKeys.list() });
    },
  });
}

export function useStartDirectChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (target: number | string) =>
      createConversation({
        ...(typeof target === "number" ? { account_id: target } : { username: target }),
        kind: "direct",
      }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
}

export function useRewrite() {
  return useMutation({
    mutationFn: rewriteDraft,
  });
}

export function useTranslateMessage() {
  return useMutation({
    mutationFn: ({ id, targetLanguage }: { id: number; targetLanguage: string }) =>
      translateMessage(id, { target_language: targetLanguage }),
  });
}

export function useSuggestReplies(conversationId: number) {
  return useMutation({
    mutationFn: (messageId: number) => suggestReplies(conversationId, messageId),
  });
}

export function useSummarize(conversationId: number) {
  return useMutation({
    mutationFn: (mode: "unread" | "recent" = "unread") =>
      summarizeConversation(conversationId, mode),
  });
}

export function useStyleProfile() {
  return useQuery({
    queryFn: getStyleProfile,
    queryKey: styleProfileKeys.current(),
  });
}

export function useUpdateStyleConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStyleConsent,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: styleProfileKeys.current() });
    },
  });
}

export function useBuildStyleProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: buildStyleProfile,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: styleProfileKeys.current() });
    },
  });
}
