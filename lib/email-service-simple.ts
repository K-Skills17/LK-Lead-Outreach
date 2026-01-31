/**
 * Simple Email Service using Resend
 * 
 * Ready-to-use email functions for the internal tool
 */

import { Resend } from 'resend';

// Lazy-load Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set in environment variables');
    }
    
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Send a simple email
 */
export async function sendEmail(data: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}) {
  try {
    const resend = getResendClient();
    
    const fromEmail = data.from || process.env.EMAIL_FROM || 'LK Lead Outreach <noreply@lkdigital.org>';
    
    const { data: emailData, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(data.to) ? data.to : [data.to],
      subject: data.subject,
      html: data.html,
      replyTo: data.replyTo,
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      throw error;
    }

    console.log(`[Email] Sent successfully to ${data.to}. Email ID: ${emailData?.id}`);
    return { success: true, emailId: emailData?.id };
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    throw error;
  }
}

/**
 * Send notification email to SDR
 */
export async function sendSDRNotification(data: {
  sdrEmail: string;
  sdrName: string;
  subject: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e293b 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LK Lead Outreach</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.sdrName}</strong>,</p>
      <p>${data.message}</p>
      ${data.actionUrl && data.actionText ? `
        <a href="${data.actionUrl}" class="button">${data.actionText}</a>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: data.sdrEmail,
    subject: data.subject,
    html,
  });
}

/**
 * Send reply notification to SDR
 */
export async function notifySDROfReply(data: {
  sdrEmail: string;
  sdrName: string;
  leadName: string;
  leadCompany: string;
  message: string;
  replyUrl: string;
}) {
  return await sendSDRNotification({
    sdrEmail: data.sdrEmail,
    sdrName: data.sdrName,
    subject: `Nova resposta de ${data.leadName} (${data.leadCompany})`,
    message: `
      Você recebeu uma nova resposta no WhatsApp de <strong>${data.leadName}</strong> da empresa <strong>${data.leadCompany}</strong>.
      
      <blockquote style="background: #f3f4f6; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
        "${data.message}"
      </blockquote>
      
      Acesse o dashboard para responder.
    `,
    actionUrl: data.replyUrl,
    actionText: 'Ver Resposta e Responder',
  });
}
