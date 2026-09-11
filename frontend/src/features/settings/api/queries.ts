import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listBlocks, destroyBlock } from "@/features/auth/api/blocks";
import { persistSession } from "@/features/auth/model/persist-session";
import { setPassword } from "@/features/auth/api/identity";
import {
  destroyPasskey,
  listPasskeys,
  registerPasskey,
  renamePasskey,
} from "@/features/auth/api/passkeys";
import { listSavedMessages, unsaveMessage } from "@/features/conversations/api/http";
import {
  cancelScheduledMessage,
  createScheduledMessage,
  createExportJob,
  destroyContactNickname,
  downloadExportJob,
  getPreferences,
  listAccentConfigs,
  listContactNicknames,
  listDeviceSessions,
  listExportJobs,
  listFontConfigs,
  listScheduledMessages,
  revokeDeviceSession,
  revokeOtherDeviceSessions,
  sendScheduledMessageNow,
  updatePreferences,
  upsertContactNickname,
  type Preferences,
} from "@/features/settings/api/http";
import {
  accentConfigKeys,
  blockKeys,
  exportJobKeys,
  fontConfigKeys,
  nicknameKeys,
  passkeyKeys,
  preferenceKeys,
  savedMessageKeys,
  scheduledMessageKeys,
  sessionKeys,
} from "@/features/settings/api/keys";
import { EXPORT_POLL_MS, SCHEDULED_MESSAGES_REFRESH_MS } from "@/features/settings/model/constants";
import { shouldPollExportJobs } from "@/features/settings/model/map-sessions";
import { deepMerge } from "@/features/settings/model/map-preferences";
import preferencesRegistry from "@/shared/lib/config/preferences-registry.json";
import type { SerializedAttestation } from "@/features/auth/lib/webauthn";

function mergePreferences(
  current: Preferences | undefined,
  overlay: Record<string, unknown>,
): Preferences {
  const base =
    (current?.data as Record<string, unknown> | undefined) ??
    (structuredClone(preferencesRegistry.defaults) as Record<string, unknown>);
  return {
    data: deepMerge(base, overlay),
    updated_at: current?.updated_at ?? null,
  };
}

export function usePreferences() {
  return useQuery({
    queryFn: getPreferences,
    queryKey: preferenceKeys.document(),
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const key = preferenceKeys.document();
  return useMutation({
    mutationFn: updatePreferences,
    onMutate: async (overlay) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Preferences>(key);
      queryClient.setQueryData(key, mergePreferences(previous, overlay));
      return { previous };
    },
    onError: (_error, _overlay, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useFontConfigs() {
  return useQuery({
    queryFn: listFontConfigs,
    queryKey: fontConfigKeys.list(),
  });
}

export function useAccentConfigs() {
  return useQuery({
    queryFn: listAccentConfigs,
    queryKey: accentConfigKeys.list(),
  });
}

export function useDeviceSessions() {
  return useQuery({
    queryFn: listDeviceSessions,
    queryKey: sessionKeys.list(),
  });
}

export function useRevokeDeviceSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeDeviceSession,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
    },
  });
}

export function useRevokeOtherDeviceSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeOtherDeviceSessions,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
    },
  });
}

export function useContactNicknames() {
  return useQuery({
    queryFn: listContactNicknames,
    queryKey: nicknameKeys.list(),
  });
}

export function useUpsertContactNickname() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, nickname }: { accountId: number; nickname: string }) =>
      upsertContactNickname(accountId, nickname),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: nicknameKeys.list() });
    },
  });
}

export function useDestroyContactNickname() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: destroyContactNickname,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: nicknameKeys.list() });
    },
  });
}

export function useExportJobs() {
  return useQuery({
    queryFn: listExportJobs,
    queryKey: exportJobKeys.list(),
    refetchInterval: (query) =>
      shouldPollExportJobs(query.state.data?.export_jobs ?? []) ? EXPORT_POLL_MS : false,
  });
}

export function useCreateExportJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExportJob,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: exportJobKeys.list() });
    },
  });
}

export function useDownloadExportJob() {
  return useMutation({
    mutationFn: async (id: number) => {
      const media = await downloadExportJob(id);
      window.open(media.url, "_blank", "noopener");
      return media;
    },
  });
}

export function useSavedMessages() {
  return useQuery({
    queryFn: listSavedMessages,
    queryKey: savedMessageKeys.list(),
  });
}

export function useUnsaveMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unsaveMessage,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: savedMessageKeys.list() });
    },
  });
}

export function useScheduledMessages() {
  return useQuery({
    queryFn: listScheduledMessages,
    queryKey: scheduledMessageKeys.list(),
    refetchInterval: SCHEDULED_MESSAGES_REFRESH_MS,
  });
}

export function useCreateScheduledMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createScheduledMessage,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: scheduledMessageKeys.list() });
    },
  });
}

export function useCancelScheduledMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelScheduledMessage,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: scheduledMessageKeys.list() });
    },
  });
}

export function useSendScheduledMessageNow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendScheduledMessageNow,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: scheduledMessageKeys.list() });
    },
  });
}

export function usePasskeys() {
  return useQuery({
    queryFn: listPasskeys,
    queryKey: passkeyKeys.list(),
  });
}

export function useRenamePasskey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nickname }: { id: number; nickname: string }) => renamePasskey(id, nickname),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: passkeyKeys.list() });
    },
  });
}

export function useDestroyPasskey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: destroyPasskey,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: passkeyKeys.list() });
    },
  });
}

export function useRegisterPasskey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      nickname,
      credential,
    }: {
      nickname: string;
      credential: SerializedAttestation;
    }) => registerPasskey(nickname, credential),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: passkeyKeys.list() });
    },
  });
}

export function useSetPassword() {
  return useMutation({
    mutationFn: ({
      password,
      passwordConfirmation,
      currentPassword,
    }: {
      password: string;
      passwordConfirmation: string;
      currentPassword?: string;
    }) => setPassword(password, passwordConfirmation, currentPassword),
    onSuccess: (payload) => {
      persistSession(payload);
    },
  });
}

export function useBlocks() {
  return useQuery({
    queryFn: listBlocks,
    queryKey: blockKeys.list(),
  });
}

export function useUnblock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: destroyBlock,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: blockKeys.list() });
    },
  });
}
