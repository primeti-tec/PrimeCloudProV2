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
import { accounts, usageRecords, notifications } from "@shared/schema";
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

                // Get current usage from MinIO
                const usage = await minioService.getTenantUsageMetrics();

                // Calculate bandwidth (simulated - in production, get from MinIO/Prometheus)
                // For now, we'll estimate based on object count changes
                const currentStorageBytes = usage.storageBytes;
                const estimatedBandwidthIngress = Math.floor(currentStorageBytes * 0.1); // 10% churn estimate
                const estimatedBandwidthEgress = Math.floor(currentStorageBytes * 0.05); // 5% download estimate

                // Record usage
                await db.insert(usageRecords).values({
                    accountId: account.id,
                    storageBytes: currentStorageBytes,
                    bandwidthIngress: estimatedBandwidthIngress,
                    bandwidthEgress: estimatedBandwidthEgress,
                    requestsCount: usage.objectCount * 10, // Estimate API calls
                });

                // Update account's current usage
                await db
                    .update(accounts)
                    .set({
                        storageUsed: currentStorageBytes,
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

/**
 * Start all cron jobs
 */
export function startCronJobs(): void {
    console.log("⏰ Starting cron jobs...");

    // Usage collection - every hour
    usageCollectorInterval = setInterval(() => {
        collectUsageMetrics().catch(console.error);
    }, 60 * 60 * 1000); // 1 hour

    // Daily checks - every 24 hours
    billingCheckInterval = setInterval(() => {
        checkOverdueInvoices().catch(console.error);
        runMonthlyBilling().catch(console.error);
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Run initial collection after 10 seconds (allow server to start)
    setTimeout(() => {
        collectUsageMetrics().catch(console.error);
    }, 10000);

    console.log("✅ Cron jobs started:");
    console.log("  - Usage collection: Every hour");
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
