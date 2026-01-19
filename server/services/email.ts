/**
 * Email Service - Development Mock
 *
 * This service currently mocks email sending by logging to console.
 * 
 * To integrate with a real email service (Resend or SendGrid):
 * 
 * 1. For Resend (recommended):
 *    - Install: npm install resend
 *    - Import: import { Resend } from 'resend'
 *    - Initialize: const resend = new Resend(process.env.RESEND_API_KEY)
 *    - Replace console.log with: await resend.emails.send({ from, to, subject, html })
 * 
 * 2. For SendGrid:
 *    - Install: npm install @sendgrid/mail
 *    - Import: import sgMail from '@sendgrid/mail'
 *    - Initialize: sgMail.setApiKey(process.env.SENDGRID_API_KEY)
 *    - Replace console.log with: await sgMail.send({ from, to, subject, html })
 * 
 * 3. Environment Setup:
 *    - Add RESEND_API_KEY or SENDGRID_API_KEY to your environment variables
 *    - Optionally set FROM_EMAIL for the sender address
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email with the provided options.
 * Currently logs to console in development mode.
 * 
 * @param options - Email options containing recipient, subject, and content
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, html, text } = options;

  // Log email in a nice, readable format
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                        [EMAIL] Novo Email                      ║
╚════════════════════════════════════════════════════════════════╝

PARA:    ${to}
ASSUNTO: ${subject}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VERSÃO TEXTO:
${text || '(Nenhuma versão em texto disponível)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VERSÃO HTML:
${html}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // TODO: Implement actual email sending with Resend or SendGrid
  // For now, we're just logging to the console for development
}

/**
 * Send an invitation email to a new team member
 */
export async function sendInvitationEmail(
  email: string,
  inviterName: string,
  accountName: string,
  inviteUrl: string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #6300FF; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background-color: #6300FF; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
    .footer { color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📨 Você Foi Convidado!</h1>
    </div>
    <div class="content">
      <p>Olá,</p>
      
      <p><strong>${inviterName}</strong> convidou você para participar da organização <strong>${accountName}</strong> no CloudStorage Pro.</p>
      
      <p>Clique no botão abaixo para aceitar o convite e começar:</p>
      
      <a href="${inviteUrl}" class="button">Aceitar Convite</a>
      
      <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
      <p><code>${inviteUrl}</code></p>
      
      <p>Este convite expira em 7 dias.</p>
      
      <p>Att,<br>Equipe CloudStorage Pro</p>
    </div>
    <div class="footer">
      <p>Se você não esperava este convite, pode ignorar este email com segurança.</p>
      <p>CloudStorage Pro - Armazenamento em Nuvem S3-Compatible</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `Você Foi Convidado!

${inviterName} convidou você para participar da organização ${accountName} no CloudStorage Pro.

Aceite o convite: ${inviteUrl}

Este convite expira em 7 dias.

Se você não esperava este convite, pode ignorar este email.`;

  await sendEmail({
    to: email,
    subject: `${inviterName} convidou você para ${accountName}`,
    html,
    text,
  });
}

/**
 * Send a verification email with a code
 */
export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #6300FF; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .code-box { background-color: #1e293b; color: #f1f5f9; padding: 20px; border-radius: 6px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; font-family: monospace; margin: 20px 0; }
    .footer { color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Verifique Seu Email</h1>
    </div>
    <div class="content">
      <p>Olá,</p>
      
      <p>Use o código abaixo para verificar seu endereço de email:</p>
      
      <div class="code-box">${code}</div>
      
      <p>Este código expira em 15 minutos.</p>
      
      <p>Se você não solicitou esta verificação, pode ignorar este email.</p>
      
      <p>Att,<br>Equipe CloudStorage Pro</p>
    </div>
    <div class="footer">
      <p>Nunca compartilhe este código com ninguém. Nós nunca pediremos isso.</p>
      <p>CloudStorage Pro - Armazenamento em Nuvem S3-Compatible</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `Verifique Seu Email

Seu código de verificação é: ${code}

Este código expira em 15 minutos.

Se você não solicitou esta verificação, pode ignorar este email.`;

  await sendEmail({
    to: email,
    subject: "Verifique seu endereço de email - CloudStorage Pro",
    html,
    text,
  });
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(email: string, userName: string): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background-color: #6300FF; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
    .feature-list { list-style: none; padding: 0; }
    .feature-list li { padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .feature-list li:before { content: "✓ "; color: #10b981; font-weight: bold; }
    .feature-list li:last-child { border-bottom: none; }
    .footer { color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Bem-vindo, ${userName}!</h1>
    </div>
    <div class="content">
      <p>Estamos muito felizes em ter você conosco! Seu cadastro foi recebido com sucesso.</p>
      
      <p><strong>📋 Próximos Passos:</strong></p>
      <p>Seu cadastro está em análise por nossa equipe. Você receberá um email assim que sua conta for aprovada com suas credenciais S3.</p>
      
      <p><strong>O que você poderá fazer:</strong></p>
      
      <ul class="feature-list">
        <li>Criar e gerenciar buckets de armazenamento</li>
        <li>Convidar membros para sua equipe</li>
        <li>Gerar chaves de API para acesso programático</li>
        <li>Acessar via SFTP para transferências de arquivos</li>
        <li>Monitorar atividades com logs de auditoria</li>
      </ul>
      
      <p>Enquanto isso, você pode explorar nossa documentação:</p>
      
      <a href="https://app.cloudstoragepro.com.br/docs" class="button">Ver Documentação</a>
      
      <p>Dúvidas? Responda este email ou acesse nosso suporte.</p>
      
      <p>Att,<br>Equipe CloudStorage Pro</p>
    </div>
    <div class="footer">
      <p>Esta é uma mensagem automática. Por favor, não responda diretamente.</p>
      <p>CloudStorage Pro - Armazenamento em Nuvem S3-Compatible</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `Bem-vindo, ${userName}!

Estamos muito felizes em ter você conosco! Seu cadastro foi recebido com sucesso.

PRÓXIMOS PASSOS:
Seu cadastro está em análise. Você receberá um email assim que sua conta for aprovada com suas credenciais S3.

O que você poderá fazer:
• Criar e gerenciar buckets de armazenamento
• Convidar membros para sua equipe
• Gerar chaves de API para acesso programático
• Acessar via SFTP para transferências de arquivos
• Monitorar atividades com logs de auditoria

Dúvidas? Responda este email ou acesse nosso suporte.

Att,
Equipe CloudStorage Pro`;

  await sendEmail({
    to: email,
    subject: `Bem-vindo ao CloudStorage Pro, ${userName}!`,
    html,
    text,
  });
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .warning { background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    .button { display: inline-block; background-color: #6300FF; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
    .footer { color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔑 Redefinir Sua Senha</h1>
    </div>
    <div class="content">
      <p>Olá,</p>
      
      <p>Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:</p>
      
      <a href="${resetUrl}" class="button">Redefinir Senha</a>
      
      <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
      <p><code>${resetUrl}</code></p>
      
      <div class="warning">
        <strong>⚠️ Aviso de Segurança:</strong> Este link expira em 1 hora. Se você não solicitou a redefinição de senha, ignore este email ou entre em contato com nosso suporte imediatamente.
      </div>
      
      <p>Att,<br>Equipe CloudStorage Pro</p>
    </div>
    <div class="footer">
      <p>Por segurança, nunca compartilhe este link com ninguém. Nós nunca pediremos sua senha por email.</p>
      <p>CloudStorage Pro - Armazenamento em Nuvem S3-Compatible</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `Redefinir Sua Senha

Clique aqui para redefinir sua senha: ${resetUrl}

Este link expira em 1 hora.

Se você não solicitou esta redefinição, ignore este email.

Att,
Equipe CloudStorage Pro`;

  await sendEmail({
    to: email,
    subject: "Redefinir sua senha - CloudStorage Pro",
    html,
    text,
  });
}

/**
 * Send account approval email with S3 credentials
 */
export async function sendAccountApprovalEmail(
  email: string,
  userName: string,
  credentials: { endpoint: string; region: string; accessKeyId: string; secretAccessKey: string }
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .credentials-box { background-color: #1e293b; color: #f1f5f9; padding: 20px; border-radius: 8px; font-family: monospace; margin: 20px 0; }
    .credentials-box code { display: block; margin: 5px 0; }
    .warning { background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    .button { display: inline-block; background-color: #6300FF; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
    .footer { color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Conta Aprovada!</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${userName}</strong>,</p>
      
      <p>Sua conta foi aprovada! Você já pode começar a usar o CloudStorage Pro.</p>
      
      <h3>Suas Credenciais S3:</h3>
      <div class="credentials-box">
        <code><strong>Endpoint:</strong> ${credentials.endpoint}</code>
        <code><strong>Região:</strong> ${credentials.region}</code>
        <code><strong>Access Key ID:</strong> ${credentials.accessKeyId}</code>
        <code><strong>Secret Access Key:</strong> ${credentials.secretAccessKey}</code>
      </div>
      
      <div class="warning">
        <strong>⚠️ Importante:</strong> Guarde sua Secret Access Key em local seguro. Esta é a única vez que ela será exibida.
      </div>
      
      <h3>Próximos Passos:</h3>
      <ol>
        <li>Acesse o dashboard e crie seu primeiro bucket</li>
        <li>Configure seu software de backup com as credenciais acima</li>
        <li>Comece a proteger seus dados!</li>
      </ol>
      
      <a href="https://app.cloudstoragepro.com.br/dashboard" class="button">Acessar Dashboard</a>
      
      <p>Dúvidas? Responda este email ou acesse nossa documentação.</p>
    </div>
    <div class="footer">
      <p>CloudStorage Pro - Armazenamento em Nuvem S3-Compatible</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `Conta Aprovada!

Olá ${userName},

Sua conta foi aprovada! Você já pode começar a usar o CloudStorage Pro.

CREDENCIAIS S3:
Endpoint: ${credentials.endpoint}
Região: ${credentials.region}
Access Key ID: ${credentials.accessKeyId}
Secret Access Key: ${credentials.secretAccessKey}

IMPORTANTE: Guarde sua Secret Access Key em local seguro.

Acesse: https://app.cloudstoragepro.com.br/dashboard`;

  await sendEmail({
    to: email,
    subject: "✅ Conta Aprovada - CloudStorage Pro",
    html,
    text,
  });
}

/**
 * Send account rejection email
 */
export async function sendAccountRejectionEmail(
  email: string,
  userName: string,
  reason?: string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .reason-box { background-color: #fef2f2; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444; margin: 20px 0; }
    .footer { color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Cadastro Não Aprovado</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${userName}</strong>,</p>
      
      <p>Infelizmente não pudemos aprovar seu cadastro no momento.</p>
      
      ${reason ? `
      <div class="reason-box">
        <strong>Motivo:</strong> ${reason}
      </div>
      ` : ''}
      
      <p>Se você acredita que houve um erro ou gostaria de mais informações, responda este email.</p>
      
      <p>Att,<br>Equipe CloudStorage Pro</p>
    </div>
    <div class="footer">
      <p>CloudStorage Pro - Armazenamento em Nuvem S3-Compatible</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `Cadastro Não Aprovado

Olá ${userName},

Infelizmente não pudemos aprovar seu cadastro no momento.
${reason ? `Motivo: ${reason}` : ''}

Se você acredita que houve um erro, responda este email.

Att,
Equipe CloudStorage Pro`;

  await sendEmail({
    to: email,
    subject: "Cadastro não aprovado - CloudStorage Pro",
    html,
    text,
  });
}

/**
 * Send invoice email
 */
export async function sendInvoiceEmail(
  email: string,
  userName: string,
  invoiceNumber: string,
  totalAmount: number,
  dueDate: Date,
  pdfUrl?: string
): Promise<void> {
  const formattedAmount = (totalAmount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formattedDate = dueDate.toLocaleDateString('pt-BR');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .invoice-box { background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0; }
    .amount { font-size: 2em; font-weight: bold; color: #1e293b; }
    .button { display: inline-block; background-color: #6300FF; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 10px 5px 10px 0; }
    .footer { color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📄 Nova Fatura Disponível</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${userName}</strong>,</p>
      
      <p>Sua fatura está disponível para pagamento.</p>
      
      <div class="invoice-box">
        <p><strong>Fatura:</strong> ${invoiceNumber}</p>
        <p class="amount">${formattedAmount}</p>
        <p><strong>Vencimento:</strong> ${formattedDate}</p>
      </div>
      
      <a href="https://app.cloudstoragepro.com.br/billing" class="button">Ver Fatura</a>
      ${pdfUrl ? `<a href="${pdfUrl}" class="button" style="background-color: #64748b;">Baixar PDF</a>` : ''}
      
      <p>Att,<br>Equipe CloudStorage Pro</p>
    </div>
    <div class="footer">
      <p>CloudStorage Pro - Armazenamento em Nuvem S3-Compatible</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `Nova Fatura Disponível

Olá ${userName},

Sua fatura ${invoiceNumber} no valor de ${formattedAmount} está disponível.
Vencimento: ${formattedDate}

Acesse: https://app.cloudstoragepro.com.br/billing

Att,
Equipe CloudStorage Pro`;

  await sendEmail({
    to: email,
    subject: `Fatura ${invoiceNumber} - ${formattedAmount}`,
    html,
    text,
  });
}

/**
 * Send quota warning email
 */
export async function sendQuotaWarningEmail(
  email: string,
  userName: string,
  usedGB: number,
  quotaGB: number,
  usagePercent: number
): Promise<void> {
  const isUrgent = usagePercent >= 95;
  const headerColor = isUrgent ? '#ef4444' : '#f59e0b';
  const title = isUrgent ? '🚨 Quota Crítica!' : '⚠️ Alerta de Quota';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: ${headerColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .usage-box { background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0; }
    .progress-bar { background-color: #e2e8f0; border-radius: 9999px; height: 20px; overflow: hidden; }
    .progress-fill { background-color: ${headerColor}; height: 100%; border-radius: 9999px; }
    .button { display: inline-block; background-color: #6300FF; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
    .footer { color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${userName}</strong>,</p>
      
      <p>${isUrgent
      ? 'Sua quota de armazenamento está quase no limite. Ação imediata é necessária para evitar interrupções.'
      : 'Sua quota de armazenamento está se aproximando do limite. Considere fazer um upgrade do seu plano.'
    }</p>
      
      <div class="usage-box">
        <p><strong>Uso Atual:</strong> ${usedGB.toFixed(2)} GB de ${quotaGB} GB</p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${Math.min(usagePercent, 100)}%;"></div>
        </div>
        <p style="text-align: center; margin-top: 10px; font-size: 1.5em; font-weight: bold;">${usagePercent.toFixed(1)}%</p>
      </div>
      
      <a href="https://app.cloudstoragepro.com.br/billing" class="button">Fazer Upgrade</a>
      
      <p>Att,<br>Equipe CloudStorage Pro</p>
    </div>
    <div class="footer">
      <p>CloudStorage Pro - Armazenamento em Nuvem S3-Compatible</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `${title}

Olá ${userName},

${isUrgent
      ? 'Sua quota de armazenamento está quase no limite!'
      : 'Sua quota de armazenamento está se aproximando do limite.'
    }

Uso Atual: ${usedGB.toFixed(2)} GB de ${quotaGB} GB (${usagePercent.toFixed(1)}%)

Faça upgrade: https://app.cloudstoragepro.com.br/billing

Att,
Equipe CloudStorage Pro`;

  await sendEmail({
    to: email,
    subject: `${title} - ${usagePercent.toFixed(0)}% utilizado`,
    html,
    text,
  });
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  userName: string,
  invoiceNumber: string,
  amount: number,
  paymentMethod: string
): Promise<void> {
  const formattedAmount = (amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const paymentMethodLabels: Record<string, string> = {
    credit_card: 'Cartão de Crédito',
    pix: 'PIX',
    boleto: 'Boleto',
    bank_transfer: 'Transferência Bancária',
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .payment-box { background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0; text-align: center; }
    .amount { font-size: 2em; font-weight: bold; color: #10b981; }
    .button { display: inline-block; background-color: #6300FF; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
    .footer { color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💳 Pagamento Confirmado!</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${userName}</strong>,</p>
      
      <p>Seu pagamento foi recebido com sucesso. Obrigado!</p>
      
      <div class="payment-box">
        <p>✅ Pagamento Confirmado</p>
        <p class="amount">${formattedAmount}</p>
        <p><strong>Fatura:</strong> ${invoiceNumber}</p>
        <p><strong>Método:</strong> ${paymentMethodLabels[paymentMethod] || paymentMethod}</p>
        <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
      </div>
      
      <a href="https://app.cloudstoragepro.com.br/billing" class="button">Ver Histórico de Pagamentos</a>
      
      <p>Att,<br>Equipe CloudStorage Pro</p>
    </div>
    <div class="footer">
      <p>CloudStorage Pro - Armazenamento em Nuvem S3-Compatible</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `Pagamento Confirmado!

Olá ${userName},

Seu pagamento foi recebido com sucesso!

Fatura: ${invoiceNumber}
Valor: ${formattedAmount}
Método: ${paymentMethodLabels[paymentMethod] || paymentMethod}
Data: ${new Date().toLocaleDateString('pt-BR')}

Obrigado!

Att,
Equipe CloudStorage Pro`;

  await sendEmail({
    to: email,
    subject: `Pagamento Confirmado - ${formattedAmount}`,
    html,
    text,
  });
}
