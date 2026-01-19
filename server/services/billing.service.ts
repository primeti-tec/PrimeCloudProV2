/**
 * Billing Service - Automated Billing Engine
 * 
 * Features:
 * - Usage-based billing calculation
 * - Invoice generation
 * - Payment integration (Stripe/Mercado Pago ready)
 * - Quota monitoring and alerts
 * 
 * Pricing Model:
 * - Storage: R$ 0.15/GB/month
 * - Bandwidth: R$ 0.40/GB
 * - Requests: R$ 0.00001/request
 * - Minimum monthly: R$ 10.00
 */

import { db } from "../db";
import { accounts, invoices, usageRecords, notifications, subscriptions, products } from "@shared/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import crypto from "crypto";

// Pricing configuration (in centavos/cents)
export interface PricingConfig {
    storagePerGBCents: number;          // R$ per GB/month
    bandwidthPerGBCents: number;        // R$ per GB
    requestsPerThousandCents: number;   // R$ per 1000 requests
    minimumMonthlyCents: number;        // Minimum charge
    taxPercent: number;                 // ISS/Tax percentage
}

const DEFAULT_PRICING: PricingConfig = {
    storagePerGBCents: 15,         // R$ 0.15/GB
    bandwidthPerGBCents: 40,       // R$ 0.40/GB
    requestsPerThousandCents: 1,   // R$ 0.01/1000 requests
    minimumMonthlyCents: 1000,     // R$ 10.00 minimum
    taxPercent: 5,                 // 5% ISS
};

export interface UsageSummary {
    storageGB: number;
    bandwidthGB: number;
    requestsCount: number;
    storageCost: number;
    bandwidthCost: number;
    requestsCost: number;
    subtotal: number;
    tax: number;
    total: number;
}

export interface InvoiceData {
    accountId: number;
    periodStart: Date;
    periodEnd: Date;
    storageGB: number;
    storageCost: number;
    bandwidthGB: number;
    bandwidthCost: number;
    requestsCount: number;
    requestsCost: number;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    dueDate: Date;
}

/**
 * Billing Service Class
 */
export class BillingService {
    private pricing: PricingConfig;

    constructor(pricing: PricingConfig = DEFAULT_PRICING) {
        this.pricing = pricing;
    }

    /**
     * Calculate costs based on usage
     */
    calculateCosts(storageGB: number, bandwidthGB: number, requestsCount: number): UsageSummary {
        const storageCost = Math.round(storageGB * this.pricing.storagePerGBCents);
        const bandwidthCost = Math.round(bandwidthGB * this.pricing.bandwidthPerGBCents);
        const requestsCost = Math.round((requestsCount / 1000) * this.pricing.requestsPerThousandCents);

        let subtotal = storageCost + bandwidthCost + requestsCost;

        // Apply minimum charge
        if (subtotal < this.pricing.minimumMonthlyCents) {
            subtotal = this.pricing.minimumMonthlyCents;
        }

        const tax = Math.round(subtotal * (this.pricing.taxPercent / 100));
        const total = subtotal + tax;

        return {
            storageGB,
            bandwidthGB,
            requestsCount,
            storageCost,
            bandwidthCost,
            requestsCost,
            subtotal,
            tax,
            total,
        };
    }

    /**
     * Get usage for a billing period
     */
    async getUsageForPeriod(
        accountId: number,
        periodStart: Date,
        periodEnd: Date
    ): Promise<{ storageGB: number; bandwidthGB: number; requestsCount: number }> {
        try {
            // Get the latest usage record in the period for storage (point-in-time)
            const [latestUsage] = await db
                .select()
                .from(usageRecords)
                .where(
                    and(
                        eq(usageRecords.accountId, accountId),
                        gte(usageRecords.recordedAt, periodStart),
                        lte(usageRecords.recordedAt, periodEnd)
                    )
                )
                .orderBy(desc(usageRecords.recordedAt))
                .limit(1);

            // Aggregate bandwidth and requests for the period
            const [aggregated] = await db
                .select({
                    totalIngress: sql<number>`COALESCE(SUM(${usageRecords.bandwidthIngress}), 0)`,
                    totalEgress: sql<number>`COALESCE(SUM(${usageRecords.bandwidthEgress}), 0)`,
                    totalRequests: sql<number>`COALESCE(SUM(${usageRecords.requestsCount}), 0)`,
                })
                .from(usageRecords)
                .where(
                    and(
                        eq(usageRecords.accountId, accountId),
                        gte(usageRecords.recordedAt, periodStart),
                        lte(usageRecords.recordedAt, periodEnd)
                    )
                );

            const storageBytes = latestUsage?.storageBytes || 0;
            const bandwidthBytes = (aggregated?.totalIngress || 0) + (aggregated?.totalEgress || 0);
            const requestsCount = aggregated?.totalRequests || 0;

            // Convert bytes to GB
            const bytesToGB = (bytes: number) => Math.round((bytes / (1024 * 1024 * 1024)) * 100) / 100;

            return {
                storageGB: bytesToGB(storageBytes),
                bandwidthGB: bytesToGB(bandwidthBytes),
                requestsCount,
            };
        } catch (error) {
            console.error(`❌ Failed to get usage for account ${accountId}:`, error);
            return { storageGB: 0, bandwidthGB: 0, requestsCount: 0 };
        }
    }

    /**
     * Generate an invoice number
     */
    private generateInvoiceNumber(periodStart: Date): string {
        const year = periodStart.getFullYear();
        const month = String(periodStart.getMonth() + 1).padStart(2, "0");
        const random = crypto.randomBytes(3).toString("hex").toUpperCase();
        return `INV-${year}${month}-${random}`;
    }

    /**
     * Generate an invoice for a billing period
     */
    async generateInvoice(
        accountId: number,
        periodStart: Date,
        periodEnd: Date
    ): Promise<InvoiceData | null> {
        try {
            // Check if invoice already exists for this period
            const [existing] = await db
                .select()
                .from(invoices)
                .where(
                    and(
                        eq(invoices.accountId, accountId),
                        eq(invoices.periodStart, periodStart)
                    )
                )
                .limit(1);

            if (existing) {
                console.log(`Invoice already exists for account ${accountId} period ${periodStart}`);
                return null;
            }

            // Get usage for the period
            const usage = await this.getUsageForPeriod(accountId, periodStart, periodEnd);

            // Calculate costs
            const costs = this.calculateCosts(usage.storageGB, usage.bandwidthGB, usage.requestsCount);

            // Set due date to 15 days after period end
            const dueDate = new Date(periodEnd);
            dueDate.setDate(dueDate.getDate() + 15);

            // Create invoice
            const invoiceData: InvoiceData = {
                accountId,
                periodStart,
                periodEnd,
                storageGB: usage.storageGB,
                storageCost: costs.storageCost,
                bandwidthGB: usage.bandwidthGB,
                bandwidthCost: costs.bandwidthCost,
                requestsCount: usage.requestsCount,
                requestsCost: costs.requestsCost,
                subtotal: costs.subtotal,
                taxAmount: costs.tax,
                totalAmount: costs.total,
                dueDate,
            };

            const [invoice] = await db
                .insert(invoices)
                .values({
                    accountId,
                    invoiceNumber: this.generateInvoiceNumber(periodStart),
                    periodStart,
                    periodEnd,
                    storageGB: usage.storageGB,
                    storageCost: costs.storageCost,
                    bandwidthGB: usage.bandwidthGB,
                    bandwidthCost: costs.bandwidthCost,
                    subtotal: costs.subtotal,
                    taxAmount: costs.tax,
                    totalAmount: costs.total,
                    dueDate,
                    status: "pending",
                })
                .returning();

            console.log(`✅ Invoice generated: ${invoice.invoiceNumber} for account ${accountId}`);

            // Create notification
            await this.createInvoiceNotification(accountId, invoice.invoiceNumber, costs.total);

            return invoiceData;
        } catch (error) {
            console.error(`❌ Failed to generate invoice for account ${accountId}:`, error);
            return null;
        }
    }

    /**
     * Create invoice notification
     */
    private async createInvoiceNotification(
        accountId: number,
        invoiceNumber: string,
        totalAmount: number
    ): Promise<void> {
        try {
            await db.insert(notifications).values({
                accountId,
                type: "invoice_generated",
                title: "Nova Fatura Disponível",
                message: `Sua fatura ${invoiceNumber} no valor de R$ ${(totalAmount / 100).toFixed(2)} está disponível para pagamento.`,
                metadata: { invoiceNumber, totalAmount },
            });
        } catch (error) {
            console.error("Failed to create invoice notification:", error);
        }
    }

    /**
     * Generate invoices for all active accounts (monthly job)
     */
    async generateMonthlyInvoices(): Promise<{ generated: number; errors: number }> {
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        let generated = 0;
        let errors = 0;

        try {
            // Get all active accounts
            const activeAccounts = await db
                .select()
                .from(accounts)
                .where(eq(accounts.status, "active"));

            for (const account of activeAccounts) {
                try {
                    const invoice = await this.generateInvoice(account.id, periodStart, periodEnd);
                    if (invoice) generated++;
                } catch (error) {
                    console.error(`Failed to generate invoice for account ${account.id}:`, error);
                    errors++;
                }
            }

            console.log(`✅ Monthly invoices generated: ${generated}, errors: ${errors}`);
            return { generated, errors };
        } catch (error) {
            console.error("❌ Failed to generate monthly invoices:", error);
            return { generated, errors: 1 };
        }
    }

    /**
     * Check quota usage and send alerts
     */
    async checkQuotaAlerts(accountId: number): Promise<void> {
        try {
            const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId));
            if (!account) return;

            const quotaGB = account.storageQuotaGB || 100;
            const usedBytes = account.storageUsed || 0;
            const usedGB = usedBytes / (1024 * 1024 * 1024);
            const usagePercent = (usedGB / quotaGB) * 100;

            if (usagePercent >= 95) {
                await this.createQuotaAlert(accountId, "quota_critical", 95, usagePercent);
            } else if (usagePercent >= 80) {
                await this.createQuotaAlert(accountId, "quota_warning", 80, usagePercent);
            }
        } catch (error) {
            console.error(`Failed to check quota for account ${accountId}:`, error);
        }
    }

    /**
     * Create quota alert notification
     */
    private async createQuotaAlert(
        accountId: number,
        type: "quota_warning" | "quota_critical",
        threshold: number,
        currentPercent: number
    ): Promise<void> {
        const isCritical = type === "quota_critical";
        const title = isCritical ? "⚠️ Quota Crítica" : "📊 Alerta de Quota";
        const message = isCritical
            ? `Você está usando ${currentPercent.toFixed(1)}% da sua quota. Considere fazer um upgrade.`
            : `Você atingiu ${threshold}% da sua quota de armazenamento.`;

        try {
            // Check if similar notification was sent recently (last 24h)
            const [existing] = await db
                .select()
                .from(notifications)
                .where(
                    and(
                        eq(notifications.accountId, accountId),
                        eq(notifications.type, type),
                        gte(notifications.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
                    )
                )
                .limit(1);

            if (existing) return; // Don't spam

            await db.insert(notifications).values({
                accountId,
                type,
                title,
                message,
                metadata: { threshold, currentPercent },
            });
        } catch (error) {
            console.error("Failed to create quota alert:", error);
        }
    }

    /**
     * Mark invoice as paid
     */
    async markInvoicePaid(
        invoiceId: number,
        paymentMethod: string,
        paymentId?: string
    ): Promise<void> {
        try {
            await db
                .update(invoices)
                .set({
                    status: "paid",
                    paidAt: new Date(),
                    paymentMethod,
                })
                .where(eq(invoices.id, invoiceId));

            const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));

            if (invoice) {
                await db.insert(notifications).values({
                    accountId: invoice.accountId!,
                    type: "payment_received",
                    title: "Pagamento Confirmado",
                    message: `Recebemos seu pagamento da fatura ${invoice.invoiceNumber}. Obrigado!`,
                    metadata: { invoiceNumber: invoice.invoiceNumber, paymentMethod },
                });
            }

            console.log(`✅ Invoice ${invoiceId} marked as paid`);
        } catch (error) {
            console.error(`❌ Failed to mark invoice ${invoiceId} as paid:`, error);
            throw error;
        }
    }

    /**
     * Check for overdue invoices and send reminders
     */
    async checkOverdueInvoices(): Promise<{ overdueCount: number }> {
        try {
            const now = new Date();

            // Find overdue invoices
            const overdueInvoices = await db
                .select()
                .from(invoices)
                .where(
                    and(
                        eq(invoices.status, "pending"),
                        lte(invoices.dueDate, now)
                    )
                );

            for (const invoice of overdueInvoices) {
                // Update status to overdue
                await db
                    .update(invoices)
                    .set({ status: "overdue" })
                    .where(eq(invoices.id, invoice.id));

                // Send notification
                await db.insert(notifications).values({
                    accountId: invoice.accountId!,
                    type: "payment_overdue",
                    title: "⚠️ Fatura em Atraso",
                    message: `A fatura ${invoice.invoiceNumber} está vencida. Por favor, regularize o pagamento para evitar suspensão.`,
                    metadata: {
                        invoiceNumber: invoice.invoiceNumber,
                        dueDate: invoice.dueDate,
                        totalAmount: invoice.totalAmount,
                    },
                });
            }

            console.log(`⚠️ Found ${overdueInvoices.length} overdue invoices`);
            return { overdueCount: overdueInvoices.length };
        } catch (error) {
            console.error("❌ Failed to check overdue invoices:", error);
            return { overdueCount: 0 };
        }
    }

    /**
     * Get projected cost for current period
     */
    async getProjectedCost(accountId: number): Promise<UsageSummary> {
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const usage = await this.getUsageForPeriod(accountId, periodStart, periodEnd);

        // Project usage for full month
        const daysElapsed = now.getDate();
        const daysInMonth = periodEnd.getDate();
        const projectionFactor = daysInMonth / daysElapsed;

        const projectedUsage = {
            storageGB: usage.storageGB, // Storage doesn't need projection
            bandwidthGB: usage.bandwidthGB * projectionFactor,
            requestsCount: Math.round(usage.requestsCount * projectionFactor),
        };

        return this.calculateCosts(
            projectedUsage.storageGB,
            projectedUsage.bandwidthGB,
            projectedUsage.requestsCount
        );
    }
}

// Export singleton
export const billingService = new BillingService();
