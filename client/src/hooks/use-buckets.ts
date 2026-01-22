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

export function useBucketObjects(accountId: number | undefined, bucketId: number | undefined, prefix?: string) {
  return useQuery<ListObjectsResponse>({
    queryKey: ['/api/accounts', accountId, 'buckets', bucketId, 'objects', prefix || ''],
    queryFn: async () => {
      if (!accountId || !bucketId) return { objects: [], prefixes: [], prefix: '' };
      const url = new URL(buildUrl(api.objects.list.path, { accountId, bucketId }), window.location.origin);
      if (prefix) url.searchParams.set('prefix', prefix);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch objects');
      return res.json();
    },
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
    mutationFn: async (key: string) => {
      if (!accountId || !bucketId) throw new Error('No account or bucket');
      const url = new URL(buildUrl(api.objects.getDownloadUrl.path, { accountId, bucketId }), window.location.origin);
      url.searchParams.set('key', key);
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
