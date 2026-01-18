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
║                        [EMAIL] New Email                       ║
╚════════════════════════════════════════════════════════════════╝

TO:      ${to}
SUBJECT: ${subject}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEXT VERSION:
${text || '(No plain text version provided)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HTML VERSION:
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
    .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .button { display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
    .footer { color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You're Invited to ${accountName}</h1>
    </div>
    
    <p>Hi there,</p>
    
    <p><strong>${inviterName}</strong> has invited you to join <strong>${accountName}</strong>.</p>
    
    <p>Click the button below to accept the invitation and get started:</p>
    
    <a href="${inviteUrl}" class="button">Accept Invitation</a>
    
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p><code>${inviteUrl}</code></p>
    
    <p>This invitation will expire in 7 days.</p>
    
    <p>Best regards,<br>The Team</p>
    
    <div class="footer">
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `You're Invited to ${accountName}\n\n${inviterName} has invited you to join ${accountName}.\n\nAccept the invitation: ${inviteUrl}\n\nThis invitation will expire in 7 days.`;

  await sendEmail({
    to: email,
    subject: `${inviterName} invited you to ${accountName}`,
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
    .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .code-box { background-color: #f0f0f0; padding: 20px; border-radius: 6px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; font-family: monospace; margin: 20px 0; }
    .footer { color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verify Your Email</h1>
    </div>
    
    <p>Hi there,</p>
    
    <p>Please use the following code to verify your email address:</p>
    
    <div class="code-box">${code}</div>
    
    <p>This code will expire in 15 minutes.</p>
    
    <p>If you didn't request this verification, please ignore this email.</p>
    
    <p>Best regards,<br>The Team</p>
    
    <div class="footer">
      <p>Never share this code with anyone. We'll never ask you for it.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `Verify Your Email\n\nYour verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this, please ignore this email.`;

  await sendEmail({
    to: email,
    subject: "Verify your email address",
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
    .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .button { display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
    .feature-list { list-style: none; padding: 0; }
    .feature-list li { padding: 10px 0; }
    .feature-list li:before { content: "✓ "; color: #0070f3; font-weight: bold; }
    .footer { color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome, ${userName}!</h1>
    </div>
    
    <p>We're excited to have you on board! Your account has been successfully created.</p>
    
    <p>Here's what you can do:</p>
    
    <ul class="feature-list">
      <li>Create and manage cloud storage accounts</li>
      <li>Invite team members to collaborate</li>
      <li>Generate API keys for programmatic access</li>
      <li>Monitor activity with audit logs</li>
    </ul>
    
    <a href="https://yourapp.com/dashboard" class="button">Go to Dashboard</a>
    
    <p>If you have any questions, feel free to reach out to our support team.</p>
    
    <p>Best regards,<br>The Team</p>
    
    <div class="footer">
      <p>This is an automated message. Please don't reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `Welcome, ${userName}!\n\nWe're excited to have you on board. Your account has been successfully created.\n\nVisit your dashboard to get started: https://yourapp.com/dashboard`;

  await sendEmail({
    to: email,
    subject: `Welcome to our platform, ${userName}!`,
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
    .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .warning { background-color: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0; }
    .button { display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
    .footer { color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reset Your Password</h1>
    </div>
    
    <p>Hi there,</p>
    
    <p>We received a request to reset the password for your account. Click the button below to create a new password:</p>
    
    <a href="${resetUrl}" class="button">Reset Password</a>
    
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p><code>${resetUrl}</code></p>
    
    <div class="warning">
      <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact our support team immediately.
    </div>
    
    <p>Best regards,<br>The Team</p>
    
    <div class="footer">
      <p>For security reasons, never share this link with anyone. We'll never ask you for your password via email.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `Reset Your Password\n\nClick here to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`;

  await sendEmail({
    to: email,
    subject: "Reset your password",
    html,
    text,
  });
}
