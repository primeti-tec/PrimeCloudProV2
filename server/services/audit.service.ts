/**
 * Audit Service - Serviço Centralizado de Logs de Auditoria
 * 
 * Fornece:
 * - Logs padronizados com previous_state/current_state
 * - Níveis de severidade (info, warning, error, critical)
 * - Contexto de origem (api, panel, system, cron)
 * - Captura automática de IP e User Agent
 */

import { db } from "../db";
import { auditLogs } from "@shared/schema";
import { Request } from "express";

export type AuditSeverity = "info" | "warning" | "error" | "critical";
export type AuditContext = "api" | "panel" | "system" | "cron";

export interface AuditDetails {
    resourceId?: string | number;
    resourceName?: string;
    previous_state?: Record<string, any>;
    current_state?: Record<string, any>;
    reason?: string;
    metadata?: Record<string, any>;
}

interface AuditLogPayload {
    accountId: number;
    userId?: string | null;
    action: string;
    resource: string;
    details?: AuditDetails;
    severity?: AuditSeverity;
    context?: AuditContext;
    req?: Request; // Para extrair IP e User Agent automaticamente
}

/**
 * Audit Service Class
 */
export class AuditService {
    /**
     * Registra um log de auditoria padronizado
     */
    async log(payload: AuditLogPayload): Promise<void> {
        try {
            const ipAddress = this.extractIpAddress(payload.req);
            const userAgent = payload.req?.headers?.["user-agent"] || null;

            await db.insert(auditLogs).values({
                accountId: payload.accountId,
                userId: payload.userId || null,
                action: payload.action,
                resource: payload.resource,
                details: payload.details || {},
                severity: payload.severity || "info",
                context: payload.context || "panel",
                ipAddress,
                userAgent,
            });

            // Log para debug
            const severityIcon = {
                info: "📝",
                warning: "⚠️",
                error: "❌",
                critical: "🚨"
            }[payload.severity || "info"];

            console.log(`${severityIcon} [AUDIT] ${payload.action} - Account ${payload.accountId} - ${payload.resource}`);
        } catch (error) {
            console.error("❌ Failed to create audit log:", error);
        }
    }

    /**
     * Extrair IP do request
     */
    private extractIpAddress(req?: Request): string | null {
        if (!req) return null;
        const forwarded = req.headers["x-forwarded-for"];
        if (typeof forwarded === "string") {
            return forwarded.split(",")[0].trim();
        }
        return req.socket?.remoteAddress || null;
    }

    // ============================================
    // CONVENIENCE METHODS - Ações Comuns
    // ============================================

    async bucketCreated(accountId: number, userId: string, bucketName: string, req?: Request) {
        await this.log({
            accountId,
            userId,
            action: "bucket.created",
            resource: "bucket",
            details: { resourceName: bucketName },
            severity: "info",
            context: "panel",
            req,
        });
    }

    async bucketDeleted(accountId: number, userId: string, bucketName: string, req?: Request) {
        await this.log({
            accountId,
            userId,
            action: "bucket.deleted",
            resource: "bucket",
            details: { resourceName: bucketName },
            severity: "warning",
            context: "panel",
            req,
        });
    }

    async accessKeyCreated(accountId: number, userId: string, keyName: string, accessKeyId: string, req?: Request) {
        await this.log({
            accountId,
            userId,
            action: "access_key.created",
            resource: "access_key",
            details: { resourceName: keyName, resourceId: accessKeyId },
            severity: "info",
            context: "panel",
            req,
        });
    }

    async accessKeyRevoked(accountId: number, userId: string, keyName: string, accessKeyId: string, req?: Request) {
        await this.log({
            accountId,
            userId,
            action: "access_key.revoked",
            resource: "access_key",
            details: { resourceName: keyName, resourceId: accessKeyId },
            severity: "warning",
            context: "panel",
            req,
        });
    }

    async memberAdded(accountId: number, userId: string, memberEmail: string, role: string, req?: Request) {
        await this.log({
            accountId,
            userId,
            action: "member.added",
            resource: "member",
            details: { resourceName: memberEmail, metadata: { role } },
            severity: "info",
            context: "panel",
            req,
        });
    }

    async memberRemoved(accountId: number, userId: string, memberEmail: string, req?: Request) {
        await this.log({
            accountId,
            userId,
            action: "member.removed",
            resource: "member",
            details: { resourceName: memberEmail },
            severity: "warning",
            context: "panel",
            req,
        });
    }

    async memberRoleChanged(
        accountId: number,
        userId: string,
        memberEmail: string,
        previousRole: string,
        newRole: string,
        req?: Request
    ) {
        await this.log({
            accountId,
            userId,
            action: "member.role_changed",
            resource: "member",
            details: {
                resourceName: memberEmail,
                previous_state: { role: previousRole },
                current_state: { role: newRole },
            },
            severity: "info",
            context: "panel",
            req,
        });
    }

    async settingsUpdated(
        accountId: number,
        userId: string,
        section: string,
        updatedFields: string[],
        req?: Request
    ) {
        await this.log({
            accountId,
            userId,
            action: "settings.updated",
            resource: "settings",
            details: { metadata: { section, updatedFields } },
            severity: "info",
            context: "panel",
            req,
        });
    }

    async loginFailed(accountId: number, email: string, reason: string, req?: Request) {
        await this.log({
            accountId,
            userId: null,
            action: "auth.login_failed",
            resource: "auth",
            details: { resourceName: email, reason },
            severity: "warning",
            context: "system",
            req,
        });
    }

    async quotaExceeded(accountId: number, currentGB: number, limitGB: number) {
        await this.log({
            accountId,
            userId: null,
            action: "quota.exceeded",
            resource: "quota",
            details: {
                current_state: { usedGB: currentGB, limitGB },
                reason: `Quota exceeded: ${currentGB.toFixed(2)} GB / ${limitGB} GB`,
            },
            severity: "critical",
            context: "cron",
        });
    }

    async invoiceGenerated(accountId: number, invoiceNumber: string, totalAmount: number) {
        await this.log({
            accountId,
            userId: null,
            action: "invoice.generated",
            resource: "invoice",
            details: {
                resourceId: invoiceNumber,
                metadata: { totalAmount },
            },
            severity: "info",
            context: "cron",
        });
    }

    async paymentReceived(accountId: number, invoiceNumber: string, amount: number) {
        await this.log({
            accountId,
            userId: null,
            action: "payment.received",
            resource: "payment",
            details: {
                resourceId: invoiceNumber,
                metadata: { amount },
            },
            severity: "info",
            context: "system",
        });
    }

    async systemError(accountId: number, errorType: string, errorMessage: string) {
        await this.log({
            accountId,
            userId: null,
            action: `system.error.${errorType}`,
            resource: "system",
            details: { reason: errorMessage },
            severity: "error",
            context: "system",
        });
    }
}

// Export singleton
export const auditService = new AuditService();
