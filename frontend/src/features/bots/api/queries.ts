import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  buildStyleProfile,
  createBotRequest,
  getStyleProfile,
  listBots,
  rewriteDraft,
  suggestReplies,
  summarizeConversation,
  translateMessage,
  updateStyleConsent,
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

export function useCreateBotRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBotRequest,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: botKeys.requests() });
    },
  });
}

export function useStartDirectChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: number) => createConversation({ account_id: accountId, kind: "direct" }),
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
    mutationFn: ({
      id,
      targetLanguage,
    }: {
      id: number;
      targetLanguage: string;
    }) => translateMessage(id, { target_language: targetLanguage }),
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
