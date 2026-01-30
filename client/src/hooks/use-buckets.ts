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

export function useUpdateBucket(accountId: number | undefined) {
  return useMutation({
    mutationFn: async ({ bucketId, data }: { bucketId: number; data: { isImperiusBackup?: boolean; storageLimitGB?: number; isPublic?: boolean } }) => {
      if (!accountId) throw new Error('No account');
      const res = await apiRequest('PATCH', buildUrl(api.buckets.update.path, { accountId, bucketId }), data);
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

// ===== Bucket Objects (File Management) Hooks =====

export interface BucketObject {
  name: string;
  size: number;
  lastModified: string;
  etag?: string;
}

export interface ListObjectsResponse {
  objects: BucketObject[];
  prefixes: string[];
  prefix: string;
}

export function useBucketObjects(
  accountId: number | undefined,
  bucketId: number | undefined,
  prefix?: string,
  recursive?: boolean,
  initialData?: ListObjectsResponse
) {
  return useQuery<ListObjectsResponse>({
    queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects', prefix || '', recursive ? 'recursive' : ''],
    queryFn: async () => {
      if (!accountId || !bucketId) return { objects: [], prefixes: [], prefix: '' };
      const url = new URL(buildUrl(api.objects.list.path, { accountId, bucketId }), window.location.origin);
      if (prefix) url.searchParams.set('prefix', prefix);
      if (recursive) url.searchParams.set('recursive', 'true');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch objects');
      return res.json();
    },
    initialData,
    enabled: !!accountId && !!bucketId,
  });
}

export function useGetUploadUrl(accountId: number | undefined, bucketId: number | undefined) {
  return useMutation({
    mutationFn: async ({ filename, prefix }: { filename: string; prefix?: string }) => {
      if (!accountId || !bucketId) throw new Error('No account or bucket');
      const res = await apiRequest('POST', buildUrl(api.objects.getUploadUrl.path, { accountId, bucketId }), { filename, prefix });
      return res.json() as Promise<{ uploadUrl: string; objectKey: string }>;
    },
  });
}

export function useGetDownloadUrl(accountId: number | undefined, bucketId: number | undefined) {
  return useMutation({
    mutationFn: async (payload: { key: string; download?: boolean }) => {
      const { key, download } = typeof payload === 'string' ? { key: payload, download: false } : payload;
      if (!accountId || !bucketId) throw new Error('No account or bucket');
      const url = new URL(buildUrl(api.objects.getDownloadUrl.path, { accountId, bucketId }), window.location.origin);
      url.searchParams.set('key', key);
      if (download) url.searchParams.set('download', 'true');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to get download URL');
      return res.json() as Promise<{ downloadUrl: string }>;
    },
  });
}

export function useDeleteObject(accountId: number | undefined, bucketId: number | undefined) {
  return useMutation({
    mutationFn: async (key: string) => {
      if (!accountId || !bucketId) throw new Error('No account or bucket');
      const url = new URL(buildUrl(api.objects.delete.path, { accountId, bucketId }), window.location.origin);
      url.searchParams.set('key', key);
      const res = await apiRequest('DELETE', url.pathname + url.search);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects'] });
    },
  });
}

export function useUploadFile(accountId: number | undefined, bucketId: number | undefined) {
  const getUploadUrl = useGetUploadUrl(accountId, bucketId);

  return useMutation({
    mutationFn: async ({ file, prefix, onProgress }: { file: File; prefix?: string; onProgress?: (progress: number) => void }) => {
      if (!accountId || !bucketId) throw new Error('No account or bucket');

      // Get presigned upload URL
      const { uploadUrl, objectKey } = await getUploadUrl.mutateAsync({ filename: file.name, prefix });

      // Upload file directly to S3/MinIO
      return new Promise<{ objectKey: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            onProgress((event.loaded / event.total) * 100);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ objectKey });
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets'] });
    },
  });
}

// ===== Object Favorites, Tags, Shares =====

export interface ObjectFavoritesResponse {
  keys: string[];
}

export interface ObjectTagEntry {
  key: string;
  tags: string[];
}

export interface ObjectTagsResponse {
  tags: ObjectTagEntry[];
}

export interface ObjectShare {
  id: number;
  bucketId: number | null;
  objectKey: string;
  sharedWithEmail: string | null;
  access: string | null;
  token: string;
  expiresAt: string | null;
  createdAt: string | null;
  shareUrl: string;
}

export function useBucketFavorites(accountId: number | undefined, bucketId: number | undefined) {
  return useQuery<ObjectFavoritesResponse>({
    queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects', 'favorites'],
    queryFn: async () => {
      if (!accountId || !bucketId) return { keys: [] };
      const res = await fetch(buildUrl(api.objectFavorites.list.path, { accountId, bucketId }));
      if (!res.ok) throw new Error('Failed to fetch favorites');
      return res.json();
    },
    enabled: !!accountId && !!bucketId,
  });
}

export function useAddFavorite(accountId: number | undefined, bucketId: number | undefined) {
  return useMutation({
    mutationFn: async (key: string) => {
      if (!accountId || !bucketId) throw new Error('No account or bucket');
      const res = await apiRequest(api.objectFavorites.add.method, buildUrl(api.objectFavorites.add.path, { accountId, bucketId }), { key });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects', 'favorites'] });
    },
  });
}

export function useRemoveFavorite(accountId: number | undefined, bucketId: number | undefined) {
  return useMutation({
    mutationFn: async (key: string) => {
      if (!accountId || !bucketId) throw new Error('No account or bucket');
      const res = await apiRequest(api.objectFavorites.remove.method, buildUrl(api.objectFavorites.remove.path, { accountId, bucketId }), { key });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects', 'favorites'] });
    },
  });
}

export function useBucketTags(accountId: number | undefined, bucketId: number | undefined) {
  return useQuery<ObjectTagsResponse>({
    queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects', 'tags'],
    queryFn: async () => {
      if (!accountId || !bucketId) return { tags: [] };
      const res = await fetch(buildUrl(api.objectTags.list.path, { accountId, bucketId }));
      if (!res.ok) throw new Error('Failed to fetch tags');
      return res.json();
    },
    enabled: !!accountId && !!bucketId,
  });
}

export function useAddTag(accountId: number | undefined, bucketId: number | undefined) {
  return useMutation({
    mutationFn: async ({ key, tag }: { key: string; tag: string }) => {
      if (!accountId || !bucketId) throw new Error('No account or bucket');
      const res = await apiRequest(api.objectTags.add.method, buildUrl(api.objectTags.add.path, { accountId, bucketId }), { key, tag });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects', 'tags'] });
    },
  });
}

export function useRemoveTag(accountId: number | undefined, bucketId: number | undefined) {
  return useMutation({
    mutationFn: async ({ key, tag }: { key: string; tag: string }) => {
      if (!accountId || !bucketId) throw new Error('No account or bucket');
      const res = await apiRequest(api.objectTags.remove.method, buildUrl(api.objectTags.remove.path, { accountId, bucketId }), { key, tag });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects', 'tags'] });
    },
  });
}

export function useBucketSharesByMe(accountId: number | undefined, bucketId: number | undefined) {
  return useQuery<ObjectShare[]>({
    queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects', 'shares', 'by-me'],
    queryFn: async () => {
      if (!accountId || !bucketId) return [];
      const res = await fetch(buildUrl(api.objectShares.listByMe.path, { accountId, bucketId }));
      if (!res.ok) throw new Error('Failed to fetch shares');
      return res.json();
    },
    enabled: !!accountId && !!bucketId,
  });
}

export function useBucketSharesWithMe(accountId: number | undefined, bucketId: number | undefined) {
  return useQuery<ObjectShare[]>({
    queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects', 'shares', 'with-me'],
    queryFn: async () => {
      if (!accountId || !bucketId) return [];
      const res = await fetch(buildUrl(api.objectShares.listWithMe.path, { accountId, bucketId }));
      if (!res.ok) throw new Error('Failed to fetch shares');
      return res.json();
    },
    enabled: !!accountId && !!bucketId,
  });
}

export function useCreateShare(accountId: number | undefined, bucketId: number | undefined) {
  return useMutation({
    mutationFn: async (data: { key: string; sharedWithEmail?: string; access?: "read" | "download"; expiresAt?: string }) => {
      if (!accountId || !bucketId) throw new Error('No account or bucket');
      const res = await apiRequest(api.objectShares.create.method, buildUrl(api.objectShares.create.path, { accountId, bucketId }), data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects', 'shares'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects', 'shares', 'by-me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects', 'shares', 'with-me'] });
    },
  });
}

export function useRevokeShare(accountId: number | undefined, bucketId: number | undefined) {
  return useMutation({
    mutationFn: async (shareId: number) => {
      if (!accountId || !bucketId) throw new Error('No account or bucket');
      const url = buildUrl(api.objectShares.revoke.path, { accountId, bucketId, shareId });
      const res = await apiRequest(api.objectShares.revoke.method, url);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects', 'shares'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects', 'shares', 'by-me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects', 'shares', 'with-me'] });
    },
  });
}
