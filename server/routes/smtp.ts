import { Request, Response } from "express";
import { getAuth, requireAuth } from "@clerk/express";
import { storage } from "../storage";
import { authStorage } from "../replit_integrations/auth";
import { z } from "zod";

/**
 * SMTP Email Configuration Routes
 */

// Configure SMTP Email Settings
export const configureSMTP = requireAuth();

// Add route handler function
export async function handleConfigureSMTP(req: any, res: Response) {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.id);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return res.status(403).json({ message: "Forbidden" });
    }

    try {
        const smtpSchema = z.object({
            smtpEnabled: z.boolean().optional(),
            smtpHost: z.string().optional().nullable(),
            smtpPort: z.number().min(1).max(65535).optional().nullable(),
            smtpUser: z.string().optional().nullable(),
            smtpPass: z.string().optional().nullable(),
            smtpFromEmail: z.string().email().optional().nullable(),
            smtpFromName: z.string().optional().nullable(),
            smtpEncryption: z.enum(['none', 'ssl', 'tls']).optional().nullable(),
        });

        const smtpConfig = smtpSchema.parse(req.body);

        // Build update object - only include smtpPass if it was explicitly provided with a value
        // This prevents accidentally clearing the password when updating other settings
        const updateData: any = { ...smtpConfig };

        // If smtpPass is null, undefined, or empty string, don't update it
        // This preserves the existing password in the database
        if (!smtpConfig.smtpPass || smtpConfig.smtpPass.trim() === '') {
            delete updateData.smtpPass;
        }

        // Update account with SMTP config
        const account = await storage.updateAccount(accountId, updateData);

        // Audit log
        await storage.createAuditLog({
            accountId,
            userId,
            action: 'account.smtp_configured',
            resource: 'account',
            details: { smtpEnabled: smtpConfig.smtpEnabled, resourceId: accountId.toString() },
        });

        res.json({ message: "SMTP configuration saved successfully", account });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: err.errors[0].message });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Test SMTP Connection
export async function handleTestSMTP(req: any, res: Response) {
    const { userId } = getAuth(req);
    const accountId = parseInt(req.params.id);

    const membership = await storage.getMembership(userId, accountId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return res.status(403).json({ message: "Forbidden" });
    }

    try {
        const account = await storage.getAccount(accountId);
        if (!account || !account.smtpEnabled || !account.smtpHost) {
            return res.status(400).json({ message: "SMTP not configured for this account" });
        }

        // Get current user for test email
        const currentUser = await authStorage.getUser(userId);
        if (!currentUser || !currentUser.email) {
            return res.status(404).json({ message: "User not found" });
        }

        // Send test email
        const { sendEmail } = await import("../services/email");

        await sendEmail(
            {
                to: currentUser.email,
                subject: "Teste de Configuração SMTP - Prime Cloud Pro",
                html: `
          <p>Olá!</p>
          <p>Este é um e-mail de teste para verificar se suas configurações SMTP estão funcionando corretamente.</p>
          <p>Se você recebeu esta mensagem, significa que tudo está configurado perfeitamente!</p>
          <p>Atenciosamente,<br>Equipe Prime Cloud Pro</p>
        `,
                text: `Olá! Este é um e-mail de teste. Se você recebeu esta mensagem, suas configurações SMTP estão funcionando!`,
            },
            {
                smtpEnabled: account.smtpEnabled || false,
                smtpHost: account.smtpHost,
                smtpPort: account.smtpPort,
                smtpUser: account.smtpUser,
                smtpPass: account.smtpPass,
                smtpFromEmail: account.smtpFromEmail,
                smtpFromName: account.smtpFromName,
                smtpEncryption: account.smtpEncryption,
            }
        );

        // Audit log
        await storage.createAuditLog({
            accountId,
            userId,
            action: 'account.smtp_test',
            resource: 'account',
            details: { testEmailSent: true, resourceId: accountId.toString() },
        });

        res.json({ message: `E-mail de teste enviado para ${currentUser.email}` });
    } catch (error: any) {
        console.error("[SMTP Test] Error:", error);
        return res.status(500).json({ message: `Falha no teste: ${error.message}` });
    }
}
