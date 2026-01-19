import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";

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

export function useRejectAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const url = buildUrl(api.admin.rejectAccount.path, { id });
      const res = await apiRequest(api.admin.rejectAccount.method, url, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.listAccounts.path] });
    },
  });
}

export function useSuspendAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const url = buildUrl(api.admin.suspendAccount.path, { id });
      const res = await apiRequest(api.admin.suspendAccount.method, url, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.listAccounts.path] });
    },
  });
}

export function useReactivateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.reactivateAccount.path, { id });
      const res = await apiRequest(api.admin.reactivateAccount.method, url);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.listAccounts.path] });
    },
  });
}

export function useAdjustQuota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quotaGB, reason }: { id: number; quotaGB: number; reason: string }) => {
      const url = buildUrl(api.admin.adjustQuota.path, { id });
      const res = await apiRequest(api.admin.adjustQuota.method, url, { quotaGB, reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.listAccounts.path] });
    },
  });
}
