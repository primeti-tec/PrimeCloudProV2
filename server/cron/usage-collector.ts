/**
 * Usage Collector Cron Service
 * 
 * This service runs periodically to collect usage metrics from MinIO
 * and update the database with current storage and bandwidth usage.
 * 
 * Schedule:
 * - Usage collection: Every hour
 * - Billing check: Daily at midnight
 * - Overdue check: Daily at 9 AM
 */

import { db } from "../db";
import { accounts, usageRecords, notifications, buckets } from "@shared/schema";
import { eq } from "drizzle-orm";
import { MinioService } from "../services/minio.service";
import { billingService } from "../services/billing.service";
import { notificationService } from "../services/notification.service";

// Track scheduled jobs
let usageCollectorInterval: NodeJS.Timeout | null = null;
let billingCheckInterval: NodeJS.Timeout | null = null;

/**
 * Collect usage metrics for all active accounts
 */
async function collectUsageMetrics(): Promise<{ collected: number; errors: number }> {
    console.log("📊 Starting usage metrics collection...");

    let collected = 0;
    let errors = 0;

    try {
        // Get all active accounts
        const activeAccounts = await db
            .select()
            .from(accounts)
            .where(eq(accounts.status, "active"));

        for (const account of activeAccounts) {
            try {
                const minioService = new MinioService(String(account.id));

                // IF MinIO is not available (mock mode), DO NOT reset the volumes to 0
                // This prevents wiping out demo data if the service is temporarily down
                if (!MinioService.isAvailable()) {
                    console.log(`⚠️ MinIO not available for account ${account.id}, skipping usage update to preserve existing data.`);
                    continue;
                }

                // Get buckets from DB to sync them specifically
                const accountBuckets = await db
                    .select()
                    .from(buckets)
                    .where(eq(buckets.accountId, account.id));

                let totalStorageBytes = 0;
                let totalObjectCount = 0;

                for (const bucket of accountBuckets) {
                    try {
                        // Get stats for this specific bucket
                        // MinioService.getBucketStats handles prefixing automatically
                        const stats = await minioService.getBucketStats(bucket.name);

                        // Update bucket in DB
                        await db
                            .update(buckets)
                            .set({
                                sizeBytes: stats.sizeBytes,
                                objectCount: stats.objectCount,
                            })
                            .where(eq(buckets.id, bucket.id));

                        totalStorageBytes += stats.sizeBytes;
                        totalObjectCount += stats.objectCount;
                    } catch (err) {
                        console.error(`Failed to get stats for bucket ${bucket.name}:`, err);
                        // Fallback: If it fails, maybe it's a legacy bucket without prefix?
                        // We could try to check if the bucket exists without prefix if prefix check failed, 
                        // but MinioService.getBucketStats uses listObjects which is prefix-aware.
                    }
                }

                // If no buckets found via DB, try fallback to MinIO total (for auto-discovered buckets?)
                if (accountBuckets.length === 0) {
                    const usage = await minioService.getTenantUsageMetrics();
                    totalStorageBytes = usage.storageBytes;
                    totalObjectCount = usage.objectCount;
                }

                // Calculate bandwidth (simulated)
                const estimatedBandwidthIngress = Math.floor(totalStorageBytes * 0.1);
                const estimatedBandwidthEgress = Math.floor(totalStorageBytes * 0.05);

                // Record usage history
                await db.insert(usageRecords).values({
                    accountId: account.id,
                    storageBytes: totalStorageBytes,
                    bandwidthIngress: estimatedBandwidthIngress,
                    bandwidthEgress: estimatedBandwidthEgress,
                    requestsCount: totalObjectCount * 10,
                });

                // Update account's current usage
                await db
                    .update(accounts)
                    .set({
                        storageUsed: totalStorageBytes,
                        bandwidthUsed: Number(account.bandwidthUsed || 0) + estimatedBandwidthIngress + estimatedBandwidthEgress,
                    })
                    .where(eq(accounts.id, account.id));

                // Check quota alerts
                await notificationService.checkQuotaAlerts(account.id);

                collected++;
            } catch (error) {
                console.error(`Failed to collect usage for account ${account.id}:`, error);
                errors++;
            }
        }

        console.log(`✅ Usage collection complete: ${collected} accounts, ${errors} errors`);
    } catch (error) {
        console.error("❌ Usage collection failed:", error);
        errors++;
    }

    return { collected, errors };
}

/**
 * Check for overdue invoices and send reminders
 */
async function checkOverdueInvoices(): Promise<void> {
    console.log("💳 Checking for overdue invoices...");

    try {
        const result = await billingService.checkOverdueInvoices();

        if (result.overdueCount > 0) {
            console.log(`⚠️ Found ${result.overdueCount} overdue invoices`);
        }
    } catch (error) {
        console.error("❌ Overdue invoice check failed:", error);
    }
}

/**
 * Monthly billing job - Generate invoices for the previous month
 * Should run on the 1st of each month
 */
async function runMonthlyBilling(): Promise<void> {
    const now = new Date();

    // Only run on the 1st of the month
    if (now.getDate() !== 1) {
        return;
    }

    console.log("📄 Running monthly billing...");

    try {
        const result = await billingService.generateMonthlyInvoices();
        console.log(`✅ Monthly billing complete: ${result.generated} invoices generated, ${result.errors} errors`);
    } catch (error) {
        console.error("❌ Monthly billing failed:", error);
    }
}

// Concurrency lock
let isCollecting = false;

/**
 * Start all cron jobs
 */
export function startCronJobs(): void {
    console.log("⏰ Starting cron jobs...");

    // Usage collection - every hour
    usageCollectorInterval = setInterval(async () => {
        if (isCollecting) {
            console.log("⚠️ Usage collection already running, skipping...");
            return;
        }
        isCollecting = true;
        try {
            await collectUsageMetrics().catch(console.error);
        } finally {
            isCollecting = false;
        }
    }, 60 * 60 * 1000); // 1 hour

    // Daily checks - every 24 hours
    billingCheckInterval = setInterval(() => {
        checkOverdueInvoices().catch(console.error);
        runMonthlyBilling().catch(console.error);
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Run initial collection after 60 seconds (increased from 10s to prevent startup lag)
    setTimeout(async () => {
        if (isCollecting) return;
        isCollecting = true;
        console.log("🚀 Running initial usage collection...");
        try {
            await collectUsageMetrics().catch(console.error);
        } finally {
            isCollecting = false;
        }
    }, 60000);

    console.log("✅ Cron jobs started:");
    console.log("  - Usage collection: Every hour (initial delay: 60s)");
    console.log("  - Overdue invoice check: Daily");
    console.log("  - Monthly billing: 1st of each month");
}

/**
 * Stop all cron jobs
 */
export function stopCronJobs(): void {
    if (usageCollectorInterval) {
        clearInterval(usageCollectorInterval);
        usageCollectorInterval = null;
    }

    if (billingCheckInterval) {
        clearInterval(billingCheckInterval);
        billingCheckInterval = null;
    }

    console.log("⏹️ Cron jobs stopped");
}

/**
 * Manually trigger usage collection (for testing/admin)
 */
export async function triggerUsageCollection(): Promise<{ collected: number; errors: number }> {
    return await collectUsageMetrics();
}

/**
 * Manually trigger monthly billing (for testing/admin)
 */
export async function triggerMonthlyBilling(): Promise<{ generated: number; errors: number }> {
    return await billingService.generateMonthlyInvoices();
}
