/**
 * Notification Service - Real-time Alerts and Triggers
 * 
 * Features:
 * - Automatic notifications for quota alerts
 * - Invoice and payment notifications
 * - Account lifecycle notifications (approval, suspension)
 * - Team member notifications
 */

import { db } from "../db";
import { notifications, accounts } from "@shared/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { sendEmail } from "./email";

// Notification types matching the PRD
export type NotificationType =
    | "quota_warning_80"
    | "quota_critical_95"
    | "quota_exceeded"
    | "invoice_generated"
    | "payment_overdue"
    | "payment_received"
    | "account_suspended"
    | "account_activated"
    | "welcome"
    | "approval_approved"
    | "approval_rejected"
    | "member_invited"
    | "member_joined";

interface NotificationPayload {
    accountId: number;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, any>;
    sendEmail?: boolean;
    emailTo?: string;
}

/**
 * Notification Service Class
 */
export class NotificationService {
    /**
     * Create a notification
     */
    async create(payload: NotificationPayload): Promise<void> {
        try {
            // Check for duplicate (same type in last hour)
            const [existing] = await db
                .select()
                .from(notifications)
                .where(
                    and(
                        eq(notifications.accountId, payload.accountId),
                        eq(notifications.type, payload.type),
                        gte(notifications.createdAt, new Date(Date.now() - 60 * 60 * 1000))
                    )
                )
                .limit(1);

            // Skip if same notification sent recently (prevent spam)
            if (existing && !["welcome", "member_invited", "invoice_generated"].includes(payload.type)) {
                console.log(`Skipping duplicate notification: ${payload.type} for account ${payload.accountId}`);
                return;
            }

            // Insert notification
            await db.insert(notifications).values({
                accountId: payload.accountId,
                type: payload.type,
                title: payload.title,
                message: payload.message,
                metadata: payload.metadata || {},
            });

            console.log(`📬 Notification created: ${payload.type} for account ${payload.accountId}`);

            // Send email if requested
            if (payload.sendEmail && payload.emailTo) {
                await this.sendEmailNotification(payload);
            }
        } catch (error) {
            console.error("❌ Failed to create notification:", error);
        }
    }

    /**
     * Send email notification
     */
    private async sendEmailNotification(payload: NotificationPayload): Promise<void> {
        try {
            await sendEmail({
                to: payload.emailTo!,
                subject: payload.title,
                html: this.getEmailTemplate(payload),
                text: payload.message,
            });
        } catch (error) {
            console.error("Failed to send email notification:", error);
        }
    }

    /**
     * Get email template for notification type
     */
    private getEmailTemplate(payload: NotificationPayload): string {
        const brandColor = "#0070f3";

        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: ${brandColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .footer { color: #666; font-size: 12px; margin-top: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${payload.title}</h1>
    </div>
    <div class="content">
      <p>${payload.message}</p>
    </div>
    <div class="footer">
      <p>Prime Cloud Pro - Sua solução de armazenamento em nuvem</p>
    </div>
  </div>
</body>
</html>
    `;
    }

    // ============================================
    // QUOTA ALERTS
    // ============================================

    /**
     * Check and send quota alerts for an account
     */
    async checkQuotaAlerts(accountId: number): Promise<void> {
        try {
            const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId));
            if (!account) return;

            const quotaGB = account.storageQuotaGB || 100;
            const usedBytes = Number(account.storageUsed) || 0;
            const usedGB = usedBytes / (1024 * 1024 * 1024);
            const usagePercent = (usedGB / quotaGB) * 100;

            if (usagePercent >= 100) {
                await this.create({
                    accountId,
                    type: "quota_exceeded",
                    title: "🚨 Quota Excedida",
                    message: `Você excedeu sua quota de armazenamento. Uso atual: ${usedGB.toFixed(2)} GB de ${quotaGB} GB. Faça upgrade agora ou remova arquivos.`,
                    metadata: { usedGB, quotaGB, usagePercent },
                });
            } else if (usagePercent >= 95) {
                await this.create({
                    accountId,
                    type: "quota_critical_95",
                    title: "⚠️ Quota Crítica (95%)",
                    message: `Você está usando ${usagePercent.toFixed(1)}% da sua quota. Considere fazer um upgrade do seu plano.`,
                    metadata: { usedGB, quotaGB, usagePercent },
                });
            } else if (usagePercent >= 80) {
                await this.create({
                    accountId,
                    type: "quota_warning_80",
                    title: "📊 Alerta de Quota (80%)",
                    message: `Você atingiu 80% da sua quota de armazenamento. Planeje-se para quando precisar de mais espaço.`,
                    metadata: { usedGB, quotaGB, usagePercent },
                });
            }
        } catch (error) {
            console.error(`Failed to check quota alerts for account ${accountId}:`, error);
        }
    }

    // ============================================
    // ACCOUNT LIFECYCLE NOTIFICATIONS
    // ============================================

    /**
     * Send welcome notification
     */
    async sendWelcome(accountId: number, ownerEmail: string, ownerName: string): Promise<void> {
        await this.create({
            accountId,
            type: "welcome",
            title: "🎉 Bem-vindo ao Prime Cloud Pro!",
            message: `Olá ${ownerName}! Seu cadastro foi recebido e está em análise. Você receberá uma notificação assim que for aprovado.`,
            sendEmail: true,
            emailTo: ownerEmail,
        });
    }

    /**
     * Send account approved notification
     */
    async sendAccountApproved(
        accountId: number,
        ownerEmail: string,
        credentials: { accessKeyId: string; secretAccessKey: string }
    ): Promise<void> {
        await this.create({
            accountId,
            type: "approval_approved",
            title: "✅ Conta Aprovada!",
            message: `Sua conta foi aprovada! Você já pode começar a usar o Prime Cloud Pro. Suas credenciais S3 foram enviadas para seu email.`,
            metadata: { accessKeyId: credentials.accessKeyId },
            sendEmail: true,
            emailTo: ownerEmail,
        });
    }

    /**
     * Send account rejected notification
     */
    async sendAccountRejected(
        accountId: number,
        ownerEmail: string,
        reason?: string
    ): Promise<void> {
        await this.create({
            accountId,
            type: "approval_rejected",
            title: "❌ Cadastro Não Aprovado",
            message: reason
                ? `Infelizmente seu cadastro não foi aprovado. Motivo: ${reason}. Entre em contato se tiver dúvidas.`
                : `Infelizmente seu cadastro não foi aprovado no momento. Entre em contato para mais informações.`,
            sendEmail: true,
            emailTo: ownerEmail,
        });
    }

    /**
     * Send account suspended notification
     */
    async sendAccountSuspended(
        accountId: number,
        ownerEmail: string,
        reason?: string
    ): Promise<void> {
        await this.create({
            accountId,
            type: "account_suspended",
            title: "⚠️ Conta Suspensa",
            message: reason
                ? `Sua conta foi suspensa. Motivo: ${reason}. Entre em contato para regularizar.`
                : `Sua conta foi suspensa por falta de pagamento. Regularize sua situação para restaurar o acesso.`,
            sendEmail: true,
            emailTo: ownerEmail,
        });
    }

    /**
     * Send account reactivated notification
     */
    async sendAccountReactivated(accountId: number, ownerEmail: string): Promise<void> {
        await this.create({
            accountId,
            type: "account_activated",
            title: "✅ Conta Reativada",
            message: `Sua conta foi reativada com sucesso! Você já pode voltar a usar todos os serviços.`,
            sendEmail: true,
            emailTo: ownerEmail,
        });
    }

    // ============================================
    // BILLING NOTIFICATIONS
    // ============================================

    /**
     * Send invoice generated notification
     */
    async sendInvoiceGenerated(
        accountId: number,
        ownerEmail: string,
        invoiceNumber: string,
        totalAmount: number,
        dueDate: Date
    ): Promise<void> {
        await this.create({
            accountId,
            type: "invoice_generated",
            title: "📄 Nova Fatura Disponível",
            message: `Sua fatura ${invoiceNumber} no valor de R$ ${(totalAmount / 100).toFixed(2)} está disponível. Vencimento: ${dueDate.toLocaleDateString("pt-BR")}.`,
            metadata: { invoiceNumber, totalAmount, dueDate: dueDate.toISOString() },
            sendEmail: true,
            emailTo: ownerEmail,
        });
    }

    /**
     * Send payment received notification
     */
    async sendPaymentReceived(
        accountId: number,
        ownerEmail: string,
        invoiceNumber: string,
        amount: number
    ): Promise<void> {
        await this.create({
            accountId,
            type: "payment_received",
            title: "💳 Pagamento Confirmado",
            message: `Recebemos seu pagamento de R$ ${(amount / 100).toFixed(2)} referente à fatura ${invoiceNumber}. Obrigado!`,
            metadata: { invoiceNumber, amount },
            sendEmail: true,
            emailTo: ownerEmail,
        });
    }

    /**
     * Send payment overdue notification
     */
    async sendPaymentOverdue(
        accountId: number,
        ownerEmail: string,
        invoiceNumber: string,
        daysOverdue: number
    ): Promise<void> {
        await this.create({
            accountId,
            type: "payment_overdue",
            title: "⚠️ Pagamento em Atraso",
            message: `A fatura ${invoiceNumber} está ${daysOverdue} dias em atraso. Regularize o pagamento para evitar suspensão do serviço.`,
            metadata: { invoiceNumber, daysOverdue },
            sendEmail: true,
            emailTo: ownerEmail,
        });
    }

    // ============================================
    // TEAM NOTIFICATIONS
    // ============================================

    /**
     * Send member invited notification
     */
    async sendMemberInvited(
        accountId: number,
        inviterName: string,
        inviteeEmail: string,
        role: string,
        inviteUrl: string
    ): Promise<void> {
        await this.create({
            accountId,
            type: "member_invited",
            title: "📨 Novo Membro Convidado",
            message: `${inviterName} convidou ${inviteeEmail} para a equipe como ${role}.`,
            metadata: { inviteeEmail, role },
        });

        // Send email to invitee (this is handled separately by email service)
    }

    /**
     * Send member joined notification
     */
    async sendMemberJoined(
        accountId: number,
        memberName: string,
        memberEmail: string,
        role: string
    ): Promise<void> {
        await this.create({
            accountId,
            type: "member_joined",
            title: "🎉 Novo Membro na Equipe",
            message: `${memberName} (${memberEmail}) aceitou o convite e se juntou à equipe como ${role}.`,
            metadata: { memberName, memberEmail, role },
        });
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get recent notifications for an account
     */
    async getRecent(accountId: number, limit: number = 10): Promise<any[]> {
        return await db
            .select()
            .from(notifications)
            .where(eq(notifications.accountId, accountId))
            .orderBy(desc(notifications.createdAt))
            .limit(limit);
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: number): Promise<void> {
        await db
            .update(notifications)
            .set({ isRead: true, readAt: new Date() })
            .where(eq(notifications.id, notificationId));
    }

    /**
     * Mark all notifications as read for an account
     */
    async markAllAsRead(accountId: number): Promise<void> {
        await db
            .update(notifications)
            .set({ isRead: true, readAt: new Date() })
            .where(and(
                eq(notifications.accountId, accountId),
                eq(notifications.isRead, false)
            ));
    }
}

// Export singleton
export const notificationService = new NotificationService();
