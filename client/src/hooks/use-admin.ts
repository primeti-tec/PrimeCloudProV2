import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useAdminAccounts() {
  return useQuery({
    queryKey: [api.admin.listAccounts.path],
    queryFn: async () => {
      const res = await fetch(api.admin.listAccounts.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch admin accounts");
      return api.admin.listAccounts.responses[200].parse(await res.json());
    },
  });
}

export function useApproveAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.approveAccount.path, { id });
      const res = await fetch(url, {
        method: api.admin.approveAccount.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to approve account");
      return api.admin.approveAccount.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.listAccounts.path] });
    },
  });
}
