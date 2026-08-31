import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPreferences,
  listAccentConfigs,
  listFontConfigs,
  updatePreferences,
  type Preferences,
} from "@/features/settings/api/http";
import { accentConfigKeys, fontConfigKeys, preferenceKeys } from "@/features/settings/api/keys";
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
