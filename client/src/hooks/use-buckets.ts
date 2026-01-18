import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { buildUrl, api } from "@shared/routes";
import type { Bucket } from "@shared/schema";

export function useBuckets(accountId: number | undefined) {
  return useQuery<Bucket[]>({
    queryKey: ['/api/accounts', accountId, 'buckets'],
    queryFn: async () => {
      if (!accountId) return [];
      const res = await fetch(buildUrl(api.buckets.list.path, { accountId }));
      if (!res.ok) throw new Error('Failed to fetch buckets');
      return res.json();
    },
    enabled: !!accountId,
  });
}

export function useCreateBucket(accountId: number | undefined) {
  return useMutation({
    mutationFn: async (data: { name: string; region?: string; isPublic?: boolean }) => {
      if (!accountId) throw new Error('No account');
      const res = await apiRequest('POST', buildUrl(api.buckets.create.path, { accountId }), data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets'] });
    },
  });
}

export function useDeleteBucket(accountId: number | undefined) {
  return useMutation({
    mutationFn: async (bucketId: number) => {
      if (!accountId) throw new Error('No account');
      await apiRequest('DELETE', buildUrl(api.buckets.delete.path, { accountId, bucketId }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets'] });
    },
  });
}
