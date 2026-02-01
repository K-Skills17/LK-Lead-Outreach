/**
 * GET /api/admin/emails/test
 * Test Resend configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-service-simple';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || token !== process.env.ADMIN_DASHBOARD_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if API key is set
    const hasApiKey = !!process.env.RESEND_API_KEY;
    
    if (!hasApiKey) {
      return NextResponse.json({
        configured: false,
        error: 'RESEND_API_KEY is not set in environment variables',
        message: 'Please add RESEND_API_KEY to your .env.local file or Vercel environment variables',
      });
    }

    // Get test email from query params
    const searchParams = request.nextUrl.searchParams;
    const testEmail = searchParams.get('email');

    if (!testEmail) {
      return NextResponse.json({
        configured: true,
        apiKeySet: true,
        message: 'Resend is configured! Add ?email=your@email.com to send a test email',
        nextStep: 'Visit: /api/admin/emails/test?email=your@email.com',
      });
    }

    // Send test email
    try {
      const result = await sendEmail({
        to: testEmail,
        subject: '✅ Resend Configuration Test - LK Lead Outreach',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1e293b 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .success { background: #10b981; color: white; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Resend Configuration Test</h1>
              </div>
              <div class="content">
                <div class="success">
                  🎉 Success! Resend is properly configured!
                </div>
                <p>If you received this email, it means:</p>
                <ul>
                  <li>✅ Resend API key is set correctly</li>
                  <li>✅ Email service is working</li>
                  <li>✅ Emails can be sent successfully</li>
                </ul>
                <p><strong>Next steps:</strong></p>
                <ol>
                  <li>Configure webhook for email tracking (optional)</li>
                  <li>Verify your domain for better deliverability (recommended)</li>
                  <li>Start sending emails to leads!</li>
                </ol>
                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                  This is a test email from LK Lead Outreach system.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      return NextResponse.json({
        configured: true,
        apiKeySet: true,
        testEmailSent: true,
        emailId: result.emailId,
        message: `Test email sent successfully to ${testEmail}`,
        nextStep: 'Check your inbox (and spam folder) for the test email',
      });
    } catch (emailError: any) {
      return NextResponse.json({
        configured: true,
        apiKeySet: true,
        testEmailSent: false,
        error: emailError.message || 'Failed to send test email',
        details: emailError instanceof Error ? emailError.message : String(emailError),
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Email Test] Error:', error);
    return NextResponse.json(
      {
        configured: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
