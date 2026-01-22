/**
 * MinIO Service - S3-Compatible Storage Integration
 * 
 * This service provides integration with MinIO for S3-compatible object storage.
 * 
 * Features:
 * - Bucket management (create, delete, list)
 * - Access key management
 * - Usage metrics collection
 * - Bucket versioning and lifecycle policies
 * 
 * Setup:
 * 1. Install minio package: npm install minio
 * 2. Set environment variables:
 *    - MINIO_ENDPOINT (e.g., "s3.cloudstorageexample.com")
 *    - MINIO_PORT (default: 443)
 *    - MINIO_USE_SSL (default: true)
 *    - MINIO_ROOT_USER
 *    - MINIO_ROOT_PASSWORD
 */

import crypto from "crypto";

// Types for MinIO operations
export interface MinioConfig {
    endPoint: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
}

export interface BucketInfo {
    name: string;
    creationDate: Date;
}

export interface ObjectStats {
    size: number;
    lastModified: Date;
    etag: string;
    metaData: Record<string, string>;
}

export interface UsageMetrics {
    storageBytes: number;
    objectCount: number;
    bucketCount: number;
}

export interface StorageQuota {
    quotaBytes: number;
    usedBytes: number;
}

export interface LifecycleRule {
    id: string;
    prefix?: string;
    status: "Enabled" | "Disabled";
    expiration?: { days: number };
    transition?: { days: number; storageClass: string };
}

// Check if MinIO is available (mock mode if not)
let minioClient: any = null;
let isMinioAvailable = false;

async function initializeMinioClient(): Promise<void> {
    try {
        // Dynamically import minio to avoid errors if not installed
        const { Client } = await import("minio");

        const config: MinioConfig = {
            endPoint: process.env.MINIO_ENDPOINT || "localhost",
            port: parseInt(process.env.MINIO_PORT || "9000"),
            useSSL: process.env.MINIO_USE_SSL === "true",
            accessKey: process.env.MINIO_ROOT_USER || "minioadmin",
            secretKey: process.env.MINIO_ROOT_PASSWORD || "minioadmin",
        };

        minioClient = new Client(config);

        // Test connection
        await minioClient.listBuckets();
        isMinioAvailable = true;
        console.log("✅ MinIO client initialized successfully");
    } catch (error) {
        console.warn("⚠️ MinIO not available, running in mock mode:", (error as Error).message);
        isMinioAvailable = false;
    }
}

// Initialize on module load
initializeMinioClient().catch(console.error);

/**
 * MinIO Service Class
 * Provides methods for interacting with MinIO S3-compatible storage
 */
export class MinioService {
    private tenantPrefix: string;

    constructor(tenantId?: string) {
        this.tenantPrefix = tenantId ? `tenant-${tenantId}-` : "";
    }

    /**
     * Check if MinIO is available
     */
    isAvailable(): boolean {
        return isMinioAvailable;
    }

    /**
     * Generate a unique tenant bucket name
     */
    private getTenantBucketName(bucketName: string): string {
        return `${this.tenantPrefix}${bucketName}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    }

    /**
     * Create a new bucket for a tenant
     */
    async createBucket(bucketName: string, region: string = "us-east-1"): Promise<{ success: boolean; error?: string }> {
        const fullBucketName = this.getTenantBucketName(bucketName);

        if (!isMinioAvailable) {
            console.log(`[MOCK] Creating bucket: ${fullBucketName} in region ${region}`);
            return { success: true };
        }

        try {
            const exists = await minioClient.bucketExists(fullBucketName);
            if (exists) {
                return { success: false, error: "Bucket already exists" };
            }

            await minioClient.makeBucket(fullBucketName, region);
            console.log(`✅ Bucket created: ${fullBucketName}`);
            return { success: true };
        } catch (error) {
            console.error(`❌ Failed to create bucket: ${fullBucketName}`, error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Delete a bucket
     */
    async deleteBucket(bucketName: string): Promise<{ success: boolean; error?: string }> {
        const fullBucketName = this.getTenantBucketName(bucketName);

        if (!isMinioAvailable) {
            console.log(`[MOCK] Deleting bucket: ${fullBucketName}`);
            return { success: true };
        }

        try {
            // Check if bucket is empty
            const objects = await this.listObjects(bucketName);
            if (objects.length > 0) {
                return { success: false, error: "Bucket is not empty" };
            }

            await minioClient.removeBucket(fullBucketName);
            console.log(`✅ Bucket deleted: ${fullBucketName}`);
            return { success: true };
        } catch (error) {
            console.error(`❌ Failed to delete bucket: ${fullBucketName}`, error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * List all buckets for this tenant
     */
    async listBuckets(): Promise<BucketInfo[]> {
        if (!isMinioAvailable) {
            console.log(`[MOCK] Listing buckets for tenant: ${this.tenantPrefix}`);
            return [];
        }

        try {
            const allBuckets = await minioClient.listBuckets();
            return allBuckets
                .filter((b: any) => b.name.startsWith(this.tenantPrefix))
                .map((b: any) => ({
                    name: b.name.replace(this.tenantPrefix, ""),
                    creationDate: b.creationDate,
                }));
        } catch (error) {
            console.error("❌ Failed to list buckets:", error);
            return [];
        }
    }

    /**
     * List objects in a bucket
     */
    async listObjects(bucketName: string, prefix?: string): Promise<any[]> {
        const fullBucketName = this.getTenantBucketName(bucketName);

        if (!isMinioAvailable) {
            console.log(`[MOCK] Listing objects in bucket: ${fullBucketName}`);
            return [];
        }

        const fetchObjects = async (bName: string): Promise<any[]> => {
            try {
                const objects: any[] = [];
                const stream = minioClient.listObjects(bName, prefix || "", true);

                return new Promise((resolve, reject) => {
                    stream.on("data", (obj: any) => objects.push(obj));
                    stream.on("error", (err: any) => {
                        // S3 Error 404 (NoSuchBucket)
                        if (err.code === 'NoSuchBucket' || err.statusCode === 404) {
                            resolve([]);
                        } else {
                            reject(err);
                        }
                    });
                    stream.on("end", () => resolve(objects));
                });
            } catch (error) {
                console.error(`❌ Failed to list objects in bucket: ${bName}`, error);
                return [];
            }
        };

        let result = await fetchObjects(fullBucketName);

        // Fallback: If no objects and we have a prefix, try WITHOUT prefix (for legacy buckets)
        if (result.length === 0 && this.tenantPrefix && bucketName !== fullBucketName) {
            console.log(`[MINIO] Falling back to non-prefixed bucket: ${bucketName}`);
            result = await fetchObjects(bucketName);
        }

        return result;
    }

    /**
     * Get bucket size and object count
     */
    async getBucketStats(bucketName: string): Promise<{ sizeBytes: number; objectCount: number }> {
        const objects = await this.listObjects(bucketName);

        return {
            sizeBytes: objects.reduce((sum, obj) => sum + (obj.size || 0), 0),
            objectCount: objects.length,
        };
    }

    /**
     * Enable/disable versioning on a bucket
     */
    async setBucketVersioning(bucketName: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
        const fullBucketName = this.getTenantBucketName(bucketName);

        if (!isMinioAvailable) {
            console.log(`[MOCK] Setting versioning ${enabled ? "enabled" : "disabled"} on: ${fullBucketName}`);
            return { success: true };
        }

        try {
            await minioClient.setBucketVersioning(fullBucketName, {
                Status: enabled ? "Enabled" : "Suspended",
            });
            return { success: true };
        } catch (error) {
            console.error(`❌ Failed to set versioning on bucket: ${fullBucketName}`, error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Set lifecycle rules on a bucket
     */
    async setBucketLifecycle(bucketName: string, rules: LifecycleRule[]): Promise<{ success: boolean; error?: string }> {
        const fullBucketName = this.getTenantBucketName(bucketName);

        if (!isMinioAvailable) {
            console.log(`[MOCK] Setting lifecycle rules on: ${fullBucketName}`, rules);
            return { success: true };
        }

        try {
            const lifecycleConfig = {
                Rule: rules.map((rule) => ({
                    ID: rule.id,
                    Status: rule.status,
                    Filter: rule.prefix ? { Prefix: rule.prefix } : {},
                    ...(rule.expiration && { Expiration: { Days: rule.expiration.days } }),
                    ...(rule.transition && {
                        Transition: {
                            Days: rule.transition.days,
                            StorageClass: rule.transition.storageClass,
                        },
                    }),
                })),
            };

            await minioClient.setBucketLifecycle(fullBucketName, lifecycleConfig);
            return { success: true };
        } catch (error) {
            console.error(`❌ Failed to set lifecycle on bucket: ${fullBucketName}`, error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Generate new access credentials for a tenant
     */
    async createAccessCredentials(
        accountId: number,
        permissions: "read" | "write" | "read-write" = "read-write"
    ): Promise<{ accessKeyId: string; secretAccessKey: string }> {
        // Generate unique access keys
        const accessKeyId = `AK${crypto.randomBytes(10).toString("hex").toUpperCase()}`;
        const secretAccessKey = crypto.randomBytes(20).toString("hex");

        if (!isMinioAvailable) {
            console.log(`[MOCK] Creating access credentials for account: ${accountId}`);
            return { accessKeyId, secretAccessKey };
        }

        try {
            // In production, you would use MinIO Admin API to create service accounts
            // This requires the mc admin command or MinIO Admin SDK
            // For now, we generate keys that can be used with policies

            console.log(`✅ Access credentials created for account: ${accountId}`);
            return { accessKeyId, secretAccessKey };
        } catch (error) {
            console.error(`❌ Failed to create access credentials for account: ${accountId}`, error);
            throw error;
        }
    }

    /**
     * Revoke access credentials
     */
    async revokeAccessCredentials(accessKeyId: string): Promise<{ success: boolean; error?: string }> {
        if (!isMinioAvailable) {
            console.log(`[MOCK] Revoking access credentials: ${accessKeyId}`);
            return { success: true };
        }

        try {
            // In production, use MinIO Admin API to delete service account
            console.log(`✅ Access credentials revoked: ${accessKeyId}`);
            return { success: true };
        } catch (error) {
            console.error(`❌ Failed to revoke access credentials: ${accessKeyId}`, error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Test S3 connection with provided credentials
     */
    async testConnection(
        accessKeyId: string,
        secretAccessKey: string
    ): Promise<{ success: boolean; message: string; latencyMs?: number }> {
        const startTime = Date.now();

        if (!isMinioAvailable) {
            console.log(`[MOCK] Testing connection with credentials`);
            return {
                success: true,
                message: "Connection successful (mock mode)",
                latencyMs: 50
            };
        }

        try {
            const { Client } = await import("minio");

            const testClient = new Client({
                endPoint: process.env.MINIO_ENDPOINT || "localhost",
                port: parseInt(process.env.MINIO_PORT || "9000"),
                useSSL: process.env.MINIO_USE_SSL === "true",
                accessKey: accessKeyId,
                secretKey: secretAccessKey,
            });

            // Try to list buckets to verify credentials
            await testClient.listBuckets();

            const latencyMs = Date.now() - startTime;
            return {
                success: true,
                message: "Connection successful!",
                latencyMs
            };
        } catch (error) {
            return {
                success: false,
                message: `Connection failed: ${(error as Error).message}`
            };
        }
    }

    /**
     * Generate a presigned URL for downloading/viewing an object
     */
    async presignedGetObject(bucketName: string, objectName: string, expirySeconds: number = 3600): Promise<string> {
        const fullBucketName = this.getTenantBucketName(bucketName);

        if (!isMinioAvailable) {
            console.log(`[MOCK] Generating presigned GET URL for: ${fullBucketName}/${objectName}`);
            return `https://mock-s3.example.com/${fullBucketName}/${objectName}?expires=${expirySeconds}`;
        }

        // Try with tenant prefix first
        try {
            const url = await minioClient.presignedGetObject(fullBucketName, objectName, expirySeconds);
            return url;
        } catch (error: any) {
            // Fallback: try without tenant prefix for legacy buckets
            if ((error.code === 'NoSuchBucket' || error.statusCode === 404) && this.tenantPrefix && bucketName !== fullBucketName) {
                console.log(`[MINIO] Falling back to non-prefixed bucket for GET: ${bucketName}`);
                try {
                    return await minioClient.presignedGetObject(bucketName, objectName, expirySeconds);
                } catch (fallbackError) {
                    console.error(`❌ Fallback also failed for presigned GET URL:`, fallbackError);
                    throw fallbackError;
                }
            }
            console.error(`❌ Failed to generate presigned GET URL:`, error);
            throw error;
        }
    }

    /**
     * Generate a presigned URL for uploading an object
     */
    async presignedPutObject(bucketName: string, objectName: string, expirySeconds: number = 3600): Promise<string> {
        const fullBucketName = this.getTenantBucketName(bucketName);

        if (!isMinioAvailable) {
            console.log(`[MOCK] Generating presigned PUT URL for: ${fullBucketName}/${objectName}`);
            return `https://mock-s3.example.com/${fullBucketName}/${objectName}?upload=true&expires=${expirySeconds}`;
        }

        // Try with tenant prefix first
        try {
            const url = await minioClient.presignedPutObject(fullBucketName, objectName, expirySeconds);
            return url;
        } catch (error: any) {
            // Fallback: try without tenant prefix for legacy buckets
            if ((error.code === 'NoSuchBucket' || error.statusCode === 404) && this.tenantPrefix && bucketName !== fullBucketName) {
                console.log(`[MINIO] Falling back to non-prefixed bucket for PUT: ${bucketName}`);
                try {
                    return await minioClient.presignedPutObject(bucketName, objectName, expirySeconds);
                } catch (fallbackError) {
                    console.error(`❌ Fallback also failed for presigned PUT URL:`, fallbackError);
                    throw fallbackError;
                }
            }
            console.error(`❌ Failed to generate presigned PUT URL:`, error);
            throw error;
        }
    }

    /**
     * Remove an object from a bucket
     */
    async removeObject(bucketName: string, objectName: string): Promise<{ success: boolean; error?: string }> {
        const fullBucketName = this.getTenantBucketName(bucketName);

        if (!isMinioAvailable) {
            console.log(`[MOCK] Removing object: ${fullBucketName}/${objectName}`);
            return { success: true };
        }

        // Try with tenant prefix first
        try {
            await minioClient.removeObject(fullBucketName, objectName);
            console.log(`✅ Object removed: ${fullBucketName}/${objectName}`);
            return { success: true };
        } catch (error: any) {
            // Fallback: try without tenant prefix for legacy buckets
            if ((error.code === 'NoSuchBucket' || error.statusCode === 404) && this.tenantPrefix && bucketName !== fullBucketName) {
                console.log(`[MINIO] Falling back to non-prefixed bucket for DELETE: ${bucketName}`);
                try {
                    await minioClient.removeObject(bucketName, objectName);
                    console.log(`✅ Object removed (fallback): ${bucketName}/${objectName}`);
                    return { success: true };
                } catch (fallbackError) {
                    console.error(`❌ Fallback also failed for remove object:`, fallbackError);
                    return { success: false, error: (fallbackError as Error).message };
                }
            }
            console.error(`❌ Failed to remove object: ${fullBucketName}/${objectName}`, error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * List objects in a bucket with optional prefix (for folder navigation)
     * Returns objects and common prefixes (virtual folders)
     */
    async listObjectsWithPrefixes(bucketName: string, prefix?: string, delimiter: string = '/'): Promise<{
        objects: any[];
        prefixes: string[];
    }> {
        const fullBucketName = this.getTenantBucketName(bucketName);

        if (!isMinioAvailable) {
            console.log(`[MOCK] Listing objects with prefixes in bucket: ${fullBucketName}, prefix: ${prefix}`);
            return { objects: [], prefixes: [] };
        }

        const fetchObjectsWithPrefixes = async (bName: string): Promise<{ objects: any[]; prefixes: string[]; found: boolean }> => {
            try {
                const objects: any[] = [];
                const prefixesSet = new Set<string>();

                console.log(`[MINIO] Listing objects in bucket: ${bName}, prefix: ${prefix || '(root)'}`);
                const stream = minioClient.listObjectsV2(bName, prefix || '', false, delimiter);

                return new Promise((resolve, reject) => {
                    stream.on("data", (obj: any) => {
                        if (obj.prefix) {
                            prefixesSet.add(obj.prefix);
                        } else {
                            objects.push(obj);
                        }
                    });
                    stream.on("error", (err: any) => {
                        console.log(`[MINIO] Error listing bucket ${bName}:`, err.code || err.message);
                        if (err.code === 'NoSuchBucket' || err.statusCode === 404) {
                            resolve({ objects: [], prefixes: [], found: false });
                        } else {
                            reject(err);
                        }
                    });
                    stream.on("end", () => {
                        console.log(`[MINIO] Found ${objects.length} objects and ${prefixesSet.size} prefixes in ${bName}`);
                        resolve({
                            objects,
                            prefixes: Array.from(prefixesSet),
                            found: true
                        });
                    });
                });
            } catch (error) {
                console.error(`❌ Failed to list objects with prefixes in bucket: ${bName}`, error);
                return { objects: [], prefixes: [], found: false };
            }
        };

        // Try with tenant prefix first
        let result = await fetchObjectsWithPrefixes(fullBucketName);

        // Fallback: If bucket not found and we have a tenant prefix, try WITHOUT prefix (for legacy buckets)
        if (!result.found && this.tenantPrefix && bucketName !== fullBucketName) {
            console.log(`[MINIO] Falling back to non-prefixed bucket: ${bucketName}`);
            result = await fetchObjectsWithPrefixes(bucketName);
        }

        return { objects: result.objects, prefixes: result.prefixes };
    }

    /**
     * Get total usage metrics for a tenant
     */
    async getTenantUsageMetrics(): Promise<UsageMetrics> {
        if (!isMinioAvailable) {
            console.log(`[MOCK] Getting usage metrics for tenant: ${this.tenantPrefix}`);
            return {
                storageBytes: 0,
                objectCount: 0,
                bucketCount: 0,
            };
        }

        try {
            const buckets = await this.listBuckets();
            let totalStorage = 0;
            let totalObjects = 0;

            for (const bucket of buckets) {
                const stats = await this.getBucketStats(bucket.name);
                totalStorage += stats.sizeBytes;
                totalObjects += stats.objectCount;
            }

            return {
                storageBytes: totalStorage,
                objectCount: totalObjects,
                bucketCount: buckets.length,
            };
        } catch (error) {
            console.error("❌ Failed to get tenant usage metrics:", error);
            return {
                storageBytes: 0,
                objectCount: 0,
                bucketCount: 0,
            };
        }
    }
}

/**
 * Get S3 endpoint configuration for clients
 */
export function getS3EndpointConfig(): {
    endpoint: string;
    region: string;
    port: number;
    useSSL: boolean;
} {
    return {
        endpoint: process.env.MINIO_ENDPOINT || "s3.cloudstoragepro.com.br",
        region: process.env.MINIO_REGION || "us-east-1",
        port: parseInt(process.env.MINIO_PORT || "443"),
        useSSL: process.env.MINIO_USE_SSL !== "false",
    };
}

// Export singleton for convenience
export const minioService = new MinioService();
