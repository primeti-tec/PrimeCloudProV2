import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { buildUrl, api } from "@shared/routes";
import type { Bucket, LifecycleRule } from "@shared/schema";

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
    mutationFn: async (data: { name: string; region?: string; isPublic?: boolean; storageLimitGB?: number }) => {
      if (!accountId) throw new Error('No account');
      const res = await apiRequest('POST', buildUrl(api.buckets.create.path, { accountId }), data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets'] });
    },
  });
}

export function useUpdateBucketLimit(accountId: number | undefined) {
  return useMutation({
    mutationFn: async ({ bucketId, limit }: { bucketId: number; limit: number }) => {
      if (!accountId) throw new Error('No account');
      const res = await apiRequest('PATCH', buildUrl(api.buckets.updateLimit.path, { accountId, bucketId }), { limit });
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

export function useUpdateBucketVersioning(accountId: number | undefined) {
  return useMutation({
    mutationFn: async ({ bucketId, enabled }: { bucketId: number; enabled: boolean }) => {
      if (!accountId) throw new Error('No account');
      const res = await apiRequest('PUT', `/api/accounts/${accountId}/buckets/${bucketId}/versioning`, { enabled });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets'] });
    },
  });
}

export function useBucketLifecycle(accountId: number | undefined, bucketId: number | undefined) {
  return useQuery<LifecycleRule[]>({
    queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'lifecycle'],
    queryFn: async () => {
      if (!accountId || !bucketId) return [];
      const res = await fetch(`/api/accounts/${accountId}/buckets/${bucketId}/lifecycle`);
      if (!res.ok) throw new Error('Failed to fetch lifecycle rules');
      return res.json();
    },
    enabled: !!accountId && !!bucketId,
  });
}

export function useAddLifecycleRule(accountId: number | undefined) {
  return useMutation({
    mutationFn: async ({ bucketId, rule }: { bucketId: number; rule: Omit<LifecycleRule, 'id'> & { id: string } }) => {
      if (!accountId) throw new Error('No account');
      const res = await apiRequest('POST', `/api/accounts/${accountId}/buckets/${bucketId}/lifecycle`, rule);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets', variables.bucketId, 'lifecycle'] });
    },
  });
}

export function useDeleteLifecycleRule(accountId: number | undefined) {
  return useMutation({
    mutationFn: async ({ bucketId, ruleId }: { bucketId: number; ruleId: string }) => {
      if (!accountId) throw new Error('No account');
      const res = await apiRequest('DELETE', `/api/accounts/${accountId}/buckets/${bucketId}/lifecycle/${ruleId}`);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets', variables.bucketId, 'lifecycle'] });
    },
  });
}
