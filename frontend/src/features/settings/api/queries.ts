import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createExportJob,
  destroyContactNickname,
  downloadExportJob,
  getPreferences,
  listAccentConfigs,
  listContactNicknames,
  listDeviceSessions,
  listExportJobs,
  listFontConfigs,
  revokeDeviceSession,
  revokeOtherDeviceSessions,
  updatePreferences,
  upsertContactNickname,
  type Preferences,
} from "@/features/settings/api/http";
import {
  accentConfigKeys,
  exportJobKeys,
  fontConfigKeys,
  nicknameKeys,
  preferenceKeys,
  sessionKeys,
} from "@/features/settings/api/keys";
import { EXPORT_POLL_MS } from "@/features/settings/model/constants";
import { shouldPollExportJobs } from "@/features/settings/model/map-sessions";
import { deepMerge } from "@/features/settings/model/map-preferences";
import preferencesRegistry from "@/shared/lib/config/preferences-registry.json";

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
