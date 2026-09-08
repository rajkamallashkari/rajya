import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMe, updateProfile } from "@/features/auth/api/identity";
import { persistSession } from "@/features/auth/model/persist-session";
import { adminKeys } from "@/features/admin/api/keys";

export function useMe() {
  return useQuery({
    queryFn: fetchMe,
    queryKey: adminKeys.me(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (payload) => {
      persistSession(payload);
      queryClient.setQueryData(adminKeys.me(), payload);
    },
  });
}
