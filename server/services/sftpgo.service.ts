/**
 * SFTPGo Service - SFTP/FTPS Integration
 * 
 * This service provides integration with SFTPGo for SFTP/FTPS access.
 * 
 * Features:
 * - User provisioning (create SFTP users for tenants)
 * - Password management (reset, rotate)
 * - Virtual folder mapping to S3 buckets
 * - Access logging
 * 
 * Setup:
 * 1. Deploy SFTPGo via Docker
 * 2. Set environment variables:
 *    - SFTPGO_API_URL (e.g., "http://sftpgo:8080")
 *    - SFTPGO_API_KEY
 */

import crypto from "crypto";
import { db } from "../db";
import { sftpCredentials, buckets, accounts } from "@shared/schema";
import { eq } from "drizzle-orm";

// SFTPGo Configuration
interface SftpGoConfig {
    apiUrl: string;
    apiKey: string;
}

interface SftpGoUser {
    username: string;
    password?: string;
    status: number; // 1 = enabled, 0 = disabled
    home_dir: string;
    permissions: Record<string, string[]>;
    filesystem: SftpGoFilesystem;
    virtual_folders?: SftpGoVirtualFolder[];
}

interface SftpGoFilesystem {
    provider: number; // 0 = local, 1 = S3-compat, 2 = Google Cloud, etc.
    s3config?: {
        bucket: string;
        region: string;
        access_key: string;
        access_secret: string;
        endpoint: string;
        upload_part_size: number;
        upload_concurrency: number;
    };
}

interface SftpGoVirtualFolder {
    name: string;
    mapped_path: string;
    virtual_path: string;
    filesystem: SftpGoFilesystem;
}

// Get SFTPGo config from environment
function getSftpGoConfig(): SftpGoConfig {
    return {
        apiUrl: process.env.SFTPGO_API_URL || "http://localhost:8080",
        apiKey: process.env.SFTPGO_API_KEY || "",
    };
}

// Check if SFTPGo is available
let isSftpGoAvailable = false;

async function checkSftpGoAvailability(): Promise<boolean> {
    const config = getSftpGoConfig();

    if (!config.apiKey) {
        console.warn("⚠️ SFTPGO_API_KEY not set, running in mock mode");
        return false;
    }

    try {
        const response = await fetch(`${config.apiUrl}/api/v2/status`, {
            headers: { "X-SFTPGO-API-KEY": config.apiKey },
        });

        if (response.ok) {
            console.log("✅ SFTPGo connection verified");
            return true;
        }
        return false;
    } catch (error) {
        console.warn("⚠️ SFTPGo not available:", (error as Error).message);
        return false;
    }
}

// Check availability on module load
checkSftpGoAvailability().then((available) => {
    isSftpGoAvailable = available;
});

/**
 * Generate a secure random password
 */
function generateSecurePassword(length: number = 16): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let password = "";
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        password += chars[randomBytes[i] % chars.length];
    }
    return password;
}

/**
 * SFTPGo Service Class
 */
export class SftpGoService {
    private config: SftpGoConfig;

    constructor() {
        this.config = getSftpGoConfig();
    }

    /**
     * Check if SFTPGo is available
     */
    isAvailable(): boolean {
        return isSftpGoAvailable;
    }

    /**
     * Make an API request to SFTPGo
     */
    private async apiRequest<T>(
        method: string,
        endpoint: string,
        body?: any
    ): Promise<{ success: boolean; data?: T; error?: string }> {
        if (!isSftpGoAvailable) {
            console.log(`[MOCK] SFTPGo ${method} ${endpoint}`, body);
            return { success: true, data: body as T };
        }

        try {
            const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "X-SFTPGO-API-KEY": this.config.apiKey,
                },
                body: body ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                const errorText = await response.text();
                return { success: false, error: errorText };
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Generate SFTP username for an account
     */
    private generateUsername(accountId: number, accountSlug?: string): string {
        const slugPart = accountSlug?.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) || "";
        const randomPart = crypto.randomBytes(2).toString("hex");
        return `sftp_${slugPart || accountId}_${randomPart}`;
    }

    /**
     * Create SFTP user for an account
     */
    async createSftpUser(accountId: number): Promise<{
        success: boolean;
        username?: string;
        password?: string;
        error?: string;
    }> {
        try {
            // Get account info
            const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId));
            if (!account) {
                return { success: false, error: "Account not found" };
            }

            // Check if SFTP credentials already exist
            const [existing] = await db
                .select()
                .from(sftpCredentials)
                .where(eq(sftpCredentials.accountId, accountId));

            if (existing) {
                return {
                    success: false,
                    error: "SFTP credentials already exist for this account"
                };
            }

            // Generate credentials
            const username = this.generateUsername(accountId, account.slug || undefined);
            const password = generateSecurePassword(16);
            const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

            // Get account's buckets for virtual folders
            const accountBuckets = await db
                .select()
                .from(buckets)
                .where(eq(buckets.accountId, accountId));

            // Build SFTPGo user configuration
            const sftpUser: SftpGoUser = {
                username,
                password,
                status: 1, // enabled
                home_dir: `/home/${username}`,
                permissions: {
                    "/": ["list", "download", "upload", "create_dirs", "rename", "delete"],
                },
                filesystem: {
                    provider: 1, // S3-compatible
                    s3config: {
                        bucket: "",
                        region: process.env.MINIO_REGION || "us-east-1",
                        access_key: process.env.MINIO_ROOT_USER || "",
                        access_secret: process.env.MINIO_ROOT_PASSWORD || "",
                        endpoint: process.env.MINIO_ENDPOINT || "localhost:9000",
                        upload_part_size: 5,
                        upload_concurrency: 4,
                    },
                },
                virtual_folders: accountBuckets.map((bucket) => ({
                    name: bucket.name,
                    mapped_path: `/${bucket.name}`,
                    virtual_path: `/${bucket.name}`,
                    filesystem: {
                        provider: 1,
                        s3config: {
                            bucket: `tenant-${accountId}-${bucket.name}`,
                            region: process.env.MINIO_REGION || "us-east-1",
                            access_key: process.env.MINIO_ROOT_USER || "",
                            access_secret: process.env.MINIO_ROOT_PASSWORD || "",
                            endpoint: process.env.MINIO_ENDPOINT || "localhost:9000",
                            upload_part_size: 5,
                            upload_concurrency: 4,
                        },
                    },
                })),
            };

            // Create user in SFTPGo
            const result = await this.apiRequest<SftpGoUser>("POST", "/api/v2/users", sftpUser);

            if (!result.success) {
                return { success: false, error: result.error };
            }

            // Save to database
            await db.insert(sftpCredentials).values({
                accountId,
                username,
                passwordHash,
                status: "active",
            });

            console.log(`✅ SFTP user created: ${username} for account ${accountId}`);
            return { success: true, username, password };
        } catch (error) {
            console.error(`❌ Failed to create SFTP user for account ${accountId}:`, error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Reset SFTP password for an account
     */
    async resetSftpPassword(accountId: number): Promise<{
        success: boolean;
        password?: string;
        error?: string;
    }> {
        try {
            // Get existing credentials
            const [credential] = await db
                .select()
                .from(sftpCredentials)
                .where(eq(sftpCredentials.accountId, accountId));

            if (!credential) {
                return { success: false, error: "SFTP credentials not found" };
            }

            // Generate new password
            const newPassword = generateSecurePassword(16);
            const newPasswordHash = crypto.createHash("sha256").update(newPassword).digest("hex");

            // Update in SFTPGo
            const result = await this.apiRequest("PUT", `/api/v2/users/${credential.username}`, {
                password: newPassword,
            });

            if (!result.success && isSftpGoAvailable) {
                return { success: false, error: result.error };
            }

            // Update in database
            await db
                .update(sftpCredentials)
                .set({ passwordHash: newPasswordHash })
                .where(eq(sftpCredentials.accountId, accountId));

            console.log(`✅ SFTP password reset for account ${accountId}`);
            return { success: true, password: newPassword };
        } catch (error) {
            console.error(`❌ Failed to reset SFTP password for account ${accountId}:`, error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Add a bucket as virtual folder to SFTP user
     */
    async addBucketToSftpUser(accountId: number, bucketName: string): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            const [credential] = await db
                .select()
                .from(sftpCredentials)
                .where(eq(sftpCredentials.accountId, accountId));

            if (!credential) {
                // No SFTP user yet, nothing to do
                return { success: true };
            }

            // Get current user config
            const userResult = await this.apiRequest<SftpGoUser>(
                "GET",
                `/api/v2/users/${credential.username}`
            );

            if (!userResult.success || !userResult.data) {
                if (!isSftpGoAvailable) {
                    console.log(`[MOCK] Adding bucket ${bucketName} to SFTP user ${credential.username}`);
                    return { success: true };
                }
                return { success: false, error: userResult.error };
            }

            // Add new virtual folder
            const newFolder: SftpGoVirtualFolder = {
                name: bucketName,
                mapped_path: `/${bucketName}`,
                virtual_path: `/${bucketName}`,
                filesystem: {
                    provider: 1,
                    s3config: {
                        bucket: `tenant-${accountId}-${bucketName}`,
                        region: process.env.MINIO_REGION || "us-east-1",
                        access_key: process.env.MINIO_ROOT_USER || "",
                        access_secret: process.env.MINIO_ROOT_PASSWORD || "",
                        endpoint: process.env.MINIO_ENDPOINT || "localhost:9000",
                        upload_part_size: 5,
                        upload_concurrency: 4,
                    },
                },
            };

            const updatedFolders = [...(userResult.data.virtual_folders || []), newFolder];

            // Update user
            const updateResult = await this.apiRequest("PUT", `/api/v2/users/${credential.username}`, {
                virtual_folders: updatedFolders,
            });

            if (!updateResult.success) {
                return { success: false, error: updateResult.error };
            }

            console.log(`✅ Bucket ${bucketName} added to SFTP user ${credential.username}`);
            return { success: true };
        } catch (error) {
            console.error(`❌ Failed to add bucket to SFTP user:`, error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Disable SFTP access for an account
     */
    async disableSftpUser(accountId: number): Promise<{ success: boolean; error?: string }> {
        try {
            const [credential] = await db
                .select()
                .from(sftpCredentials)
                .where(eq(sftpCredentials.accountId, accountId));

            if (!credential) {
                return { success: false, error: "SFTP credentials not found" };
            }

            // Disable in SFTPGo
            await this.apiRequest("PUT", `/api/v2/users/${credential.username}`, {
                status: 0, // disabled
            });

            // Update in database
            await db
                .update(sftpCredentials)
                .set({ status: "revoked" })
                .where(eq(sftpCredentials.accountId, accountId));

            console.log(`✅ SFTP access disabled for account ${accountId}`);
            return { success: true };
        } catch (error) {
            console.error(`❌ Failed to disable SFTP user:`, error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Get SFTP connection info for display
     */
    getSftpConnectionInfo(): {
        host: string;
        port: number;
        protocol: string;
        ftpsPort: number;
    } {
        return {
            host: process.env.SFTP_HOST || "sftp.cloudstoragepro.com.br",
            port: parseInt(process.env.SFTP_PORT || "2022"),
            protocol: "SFTP",
            ftpsPort: parseInt(process.env.FTPS_PORT || "2121"),
        };
    }
}

// Export singleton
export const sftpGoService = new SftpGoService();
