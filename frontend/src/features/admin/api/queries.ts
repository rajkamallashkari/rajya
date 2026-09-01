import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getThemeOverridePalette,
  listAdminFeatureFlags,
  listAdminSettings,
  listAdminThemeOverrides,
  listAdminTranslationStrings,
  resetAdminSetting,
  resetAdminThemeOverrides,
  resetAdminTranslationString,
  updateAdminFeatureFlag,
  updateAdminSetting,
  updateAdminThemeOverride,
  updateAdminTranslationString,
} from "@/features/admin/api/http";
import { adminKeys } from "@/features/admin/api/keys";
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
