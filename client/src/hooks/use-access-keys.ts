import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { buildUrl, api } from "@shared/routes";
import type { AccessKey } from "@shared/schema";

export function useAccessKeys(accountId: number | undefined) {
  return useQuery<AccessKey[]>({
    queryKey: ['/api/accounts', accountId, 'access-keys'],
    queryFn: async () => {
      if (!accountId) return [];
      const res = await fetch(buildUrl(api.accessKeys.list.path, { accountId }));
      if (!res.ok) throw new Error('Failed to fetch access keys');
      return res.json();
    },
    enabled: !!accountId,
  });
}

export function useCreateAccessKey(accountId: number | undefined) {
  return useMutation({
    mutationFn: async (data: { name: string; permissions?: string }) => {
      if (!accountId) throw new Error('No account');
      const res = await apiRequest('POST', buildUrl(api.accessKeys.create.path, { accountId }), data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'access-keys'] });
    },
  });
}

export function useRevokeAccessKey(accountId: number | undefined) {
  return useMutation({
    mutationFn: async (keyId: number) => {
      if (!accountId) throw new Error('No account');
      await apiRequest('DELETE', buildUrl(api.accessKeys.revoke.path, { accountId, keyId }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'access-keys'] });
    },
  });
}
