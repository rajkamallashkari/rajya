import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addAdminSticker,
  approveAdminBotRequest,
  createAdminStickerPack,
  deactivateAdminReportAccount,
  declineAdminBotRequest,
  destroyAdminStickerPack,
  dismissAdminReport,
  getAdminDashboard,
  getAdminReport,
  getAdminUser,
  getThemeOverridePalette,
  listAdminAuditEvents,
  listAdminBotRequests,
  listAdminFeatureFlags,
  listAdminPromptTemplates,
  listAdminReports,
  listAdminSettings,
  listAdminStickerPacks,
  listAdminThemeOverrides,
  listAdminTranscript,
  listAdminTranslationStrings,
  listAdminUsers,
  removeAdminReportContent,
  removeAdminSticker,
  reorderAdminStickerPacks,
  resetAdminSetting,
  resetAdminThemeOverrides,
  resetAdminTranslationString,
  startAdminImpersonation,
  stopAdminImpersonation,
  updateAdminFeatureFlag,
  updateAdminPromptTemplate,
  updateAdminSetting,
  updateAdminStickerPack,
  updateAdminThemeOverride,
  updateAdminTranslationString,
  warnAdminReport,
} from "@/features/admin/api/http";
import { adminKeys } from "@/features/admin/api/keys";
import { startImpersonation, stopImpersonationLocally } from "@/features/admin/model/impersonation";
import { fetchMe } from "@/features/auth/api/identity";
import { i18n } from "@/shared/lib/i18n";

export function useMe() {
  return useQuery({
    queryFn: fetchMe,
    queryKey: adminKeys.me(),
  });
}

export function useAdminSettings() {
  return useQuery({
    queryFn: listAdminSettings,
    queryKey: adminKeys.settings(),
  });
}

export function useUpdateAdminSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => updateAdminSetting(key, value),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.settings() });
    },
  });
}

export function useResetAdminSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetAdminSetting,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.settings() });
    },
  });
}

export function useAdminFeatureFlags() {
  return useQuery({
    queryFn: listAdminFeatureFlags,
    queryKey: adminKeys.flags(),
  });
}

export function useUpdateAdminFeatureFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      enabled,
      key,
      rollout,
    }: {
      enabled: boolean;
      key: string;
      rollout: Record<string, unknown>;
    }) => updateAdminFeatureFlag(key, enabled, rollout),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.flags() });
    },
  });
}

export function useAdminTranslationStrings(query: { q?: string; surface?: string }) {
  return useQuery({
    queryFn: () => listAdminTranslationStrings(query),
    queryKey: adminKeys.strings(query),
  });
}

export function useUpdateAdminTranslationString() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      updateAdminTranslationString(key, value),
    onSuccess: (row) => {
      const entry = row.translation_string;
      if (entry?.key) {
        i18n.addResource(entry.locale ?? "en", "translation", entry.key, entry.value ?? "");
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.stringsRoot() });
    },
  });
}

export function useResetAdminTranslationString() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => resetAdminTranslationString(key),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.stringsRoot() });
    },
  });
}

export function useAdminThemeOverrides() {
  return useQuery({
    queryFn: listAdminThemeOverrides,
    queryKey: adminKeys.themeAdmin(),
  });
}

export function useThemeOverridePalette() {
  return useQuery({
    queryFn: getThemeOverridePalette,
    queryKey: adminKeys.themePalette(),
  });
}

export function useUpdateAdminThemeOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      theme,
      tokenName,
      value,
    }: {
      theme: string;
      tokenName: string;
      value: string;
    }) => updateAdminThemeOverride(theme, tokenName, value),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.themeAdmin() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.themePalette() });
    },
  });
}

export function useResetAdminThemeOverrides() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ theme, tokenName }: { theme?: string; tokenName?: string }) =>
      resetAdminThemeOverrides(theme, tokenName),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.themeAdmin() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.themePalette() });
    },
  });
}

export function useAdminUsers(q?: string) {
  return useQuery({
    queryFn: () => listAdminUsers(q),
    queryKey: adminKeys.users(q),
  });
}

export function useAdminUser(id: number) {
  return useQuery({
    enabled: Number.isFinite(id) && id > 0,
    queryFn: () => getAdminUser(id),
    queryKey: adminKeys.user(id),
  });
}

export function useAdminTranscript(conversationId: number) {
  return useQuery({
    enabled: Number.isFinite(conversationId) && conversationId > 0,
    queryFn: () => listAdminTranscript(conversationId),
    queryKey: adminKeys.transcript(conversationId),
  });
}

export function useAdminAuditEvents(actionName?: string) {
  return useQuery({
    queryFn: () => listAdminAuditEvents(actionName),
    queryKey: adminKeys.audit(actionName),
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryFn: getAdminDashboard,
    queryKey: adminKeys.dashboard(),
  });
}

export function useAdminPromptTemplates() {
  return useQuery({
    queryFn: listAdminPromptTemplates,
    queryKey: adminKeys.prompts(),
  });
}

export function useUpdateAdminPromptTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ capability, template }: { capability: string; template: string }) =>
      updateAdminPromptTemplate(capability, template),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.prompts() });
    },
  });
}

export function useAdminBotRequests() {
  return useQuery({
    queryFn: listAdminBotRequests,
    queryKey: adminKeys.bots(),
  });
}

export function useApproveAdminBotRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveAdminBotRequest,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.bots() });
    },
  });
}

export function useDeclineAdminBotRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      declineAdminBotRequest(id, reason),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.bots() });
    },
  });
}

export function useAdminReports(filters: {
  maxAgeHours?: number;
  status?: string;
  subjectType?: string;
}) {
  return useQuery({
    queryFn: () =>
      listAdminReports({
        max_age_hours: filters.maxAgeHours,
        status: filters.status,
        subject_type: filters.subjectType,
      }),
    queryKey: adminKeys.reports(filters),
  });
}

export function useAdminReport(id: number) {
  return useQuery({
    enabled: Number.isFinite(id) && id > 0,
    queryFn: () => getAdminReport(id),
    queryKey: adminKeys.report(id),
  });
}

function invalidateReports(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: adminKeys.reportsRoot() });
  void queryClient.invalidateQueries({ queryKey: adminKeys.reportRoot() });
}

function useReportMutation(
  mutationFn: (args: { id: number; note?: string }) => ReturnType<typeof dismissAdminReport>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => {
      invalidateReports(queryClient);
    },
  });
}

export function useDismissAdminReport() {
  return useReportMutation(({ id, note }) => dismissAdminReport(id, note));
}

export function useWarnAdminReport() {
  return useReportMutation(({ id, note }) => warnAdminReport(id, note));
}

export function useRemoveAdminReportContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeAdminReportContent,
    onSettled: () => {
      invalidateReports(queryClient);
    },
  });
}

export function useDeactivateAdminReportAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateAdminReportAccount,
    onSettled: () => {
      invalidateReports(queryClient);
    },
  });
}

export function useAdminStickerPacks() {
  return useQuery({
    queryFn: listAdminStickerPacks,
    queryKey: adminKeys.packs(),
  });
}

export function useCreateAdminStickerPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, name }: { kind: "sticker" | "emoji"; name: string }) =>
      createAdminStickerPack(name, kind),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.packs() });
    },
  });
}

export function useUpdateAdminStickerPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      id,
    }: {
      body: { name?: string; position?: number; published?: boolean };
      id: number;
    }) => updateAdminStickerPack(id, body),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.packs() });
    },
  });
}

export function useDestroyAdminStickerPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: destroyAdminStickerPack,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.packs() });
    },
  });
}

export function useReorderAdminStickerPacks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderAdminStickerPacks,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.packs() });
    },
  });
}

export function useAddAdminSticker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      packId,
      shortcode,
      signedId,
    }: {
      packId: number;
      shortcode: string;
      signedId: string;
    }) => addAdminSticker(packId, signedId, shortcode),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.packs() });
    },
  });
}

export function useRemoveAdminSticker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, packId }: { id: number; packId: number }) => removeAdminSticker(packId, id),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.packs() });
    },
  });
}

export function useStartImpersonation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startAdminImpersonation,
    onSuccess: (payload) => {
      startImpersonation(payload);
      void queryClient.invalidateQueries();
    },
  });
}

export function useStopImpersonation() {
  const queryClient = useQueryClient();
  return () => {
    void (async () => {
      try {
        await stopAdminImpersonation();
      } catch {
        stopImpersonationLocally();
        await queryClient.invalidateQueries();
        return;
      }
      stopImpersonationLocally();
      await queryClient.invalidateQueries();
    })();
  };
}
