import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import type { QuotaRequest, Account } from "@shared/schema";

export function useQuotaRequests(accountId: number | undefined) {
  return useQuery<QuotaRequest[]>({
    queryKey: ['/api/accounts', accountId, 'quota-requests'],
    queryFn: async () => {
      if (!accountId) throw new Error("No account ID");
      const url = buildUrl(api.quotaRequests.list.path, { accountId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch quota requests");
      return res.json();
    },
    enabled: !!accountId,
  });
}

export function usePendingQuotaRequests() {
  return useQuery<(QuotaRequest & { account: Account })[]>({
    queryKey: [api.quotaRequests.listPending.path],
    queryFn: async () => {
      const res = await fetch(api.quotaRequests.listPending.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch pending quota requests");
      return res.json();
    },
  });
}

export function useCreateQuotaRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, requestedQuotaGB, reason }: { accountId: number; requestedQuotaGB: number; reason?: string }) => {
      const url = buildUrl(api.quotaRequests.create.path, { accountId });
      const res = await apiRequest(api.quotaRequests.create.method, url, { requestedQuotaGB, reason });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', variables.accountId, 'quota-requests'] });
    },
  });
}

export function useApproveQuotaRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: number; note?: string }) => {
      const url = buildUrl(api.quotaRequests.approve.path, { id });
      const res = await apiRequest(api.quotaRequests.approve.method, url, { note });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.quotaRequests.listPending.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.listAccounts.path] });
    },
  });
}

export function useRejectQuotaRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: number; note?: string }) => {
      const url = buildUrl(api.quotaRequests.reject.path, { id });
      const res = await apiRequest(api.quotaRequests.reject.method, url, { note });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.quotaRequests.listPending.path] });
    },
  });
}
