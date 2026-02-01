import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/email-service-simple';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Email send request schema
const sendEmailSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  subject: z.string().min(1, 'Subject is required'),
  htmlContent: z.string().min(1, 'HTML content is required'),
  textContent: z.string().optional(),
  fromEmail: z.string().email().optional(),
  replyTo: z.string().email().optional(),
});

/**
 * POST /api/admin/emails/send
 * Send email to a lead (admin only)
 * Tracks email and links to SDR queue
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validated = sendEmailSchema.parse(body);

    // Get contact details
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('id, nome, empresa, email, assigned_sdr_id, campaign_id')
      .eq('id', validated.contactId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    if (!contact.email) {
      return NextResponse.json(
        { error: 'Contact has no email address' },
        { status: 400 }
      );
    }

    // Check contact frequency (respect days since last contact)
    const { canContactLead, DEFAULT_HUMAN_BEHAVIOR_SETTINGS } = await import('@/lib/human-behavior-service');
    const contactCheck = await canContactLead(null, contact.email, DEFAULT_HUMAN_BEHAVIOR_SETTINGS.daysSinceLastContact);
    
    if (!contactCheck.canContact) {
      return NextResponse.json(
        { 
          error: 'Contact frequency limit',
          message: `This contact was reached ${contactCheck.daysSinceContact?.toFixed(1)} days ago. Minimum ${DEFAULT_HUMAN_BEHAVIOR_SETTINGS.daysSinceLastContact} days required.`,
          lastContactedAt: contactCheck.lastContactedAt,
          daysSinceContact: contactCheck.daysSinceContact,
        },
        { status: 429 } // Too Many Requests
      );
    }

    // Check optimal send time (skip weekends, limit Mon/Fri)
    const { calculateOptimalSendTime } = await import('@/lib/send-time-service');
    const now = new Date();
    const sendTimeResult = await calculateOptimalSendTime({
      contactId: contact.id,
      businessType: 'general',
      leadPriority: 'MEDIUM',
      timezone: 'America/Sao_Paulo',
    });
    
    // If optimal time is in the future, schedule it (but allow immediate send if admin wants)
    // For now, we'll allow immediate sends but log the optimal time
    
    // Send email via Resend
    const fromEmail = validated.fromEmail || process.env.EMAIL_FROM || 'LK Lead Outreach <noreply@lkdigital.org>';
    const replyTo = validated.replyTo || process.env.EMAIL_REPLY_TO || 'contato@lkdigital.org';

    let resendEmailId: string | null = null;
    try {
      const emailResult = await sendEmail({
        to: contact.email,
        subject: validated.subject,
        html: validated.htmlContent,
        from: fromEmail,
        replyTo: replyTo,
      });

      resendEmailId = emailResult.emailId || null;
    } catch (emailError) {
      console.error('[Admin Email] Error sending email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email', details: emailError instanceof Error ? emailError.message : String(emailError) },
        { status: 500 }
      );
    }

    // Get admin info (if available from token or session)
    // For now, we'll use a placeholder
    const adminEmail = 'admin@lkdigital.org'; // TODO: Get from admin session

    // Create email tracking record
    const { data: emailRecord, error: insertError } = await supabaseAdmin
      .from('email_sends')
      .insert({
        campaign_contact_id: contact.id,
        lead_email: contact.email,
        lead_name: contact.nome,
        lead_company: contact.empresa,
        assigned_sdr_id: contact.assigned_sdr_id,
        subject: validated.subject,
        html_content: validated.htmlContent,
        text_content: validated.textContent || null,
        from_email: fromEmail,
        reply_to: replyTo,
        resend_email_id: resendEmailId,
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(), // Assume delivered if sent successfully
        is_delivered: true,
        sent_by_admin_email: adminEmail,
        campaign_id: contact.campaign_id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Admin Email] Error creating email record:', insertError);
      // Email was sent but tracking failed - still return success
    }

    // Create sent event
    if (emailRecord) {
      await supabaseAdmin
        .from('email_events')
        .insert({
          email_send_id: emailRecord.id,
          event_type: 'sent',
          event_data: {
            resend_email_id: resendEmailId,
            from: fromEmail,
            to: contact.email,
          },
          occurred_at: new Date().toISOString(),
        });
    }

    // Record contact in history
    const { recordContact } = await import('@/lib/human-behavior-service');
    await recordContact({
      contactId: contact.id,
      email: contact.email,
      channel: 'email',
      campaignId: contact.campaign_id || undefined,
      sdrId: contact.assigned_sdr_id || undefined,
      status: 'sent',
    });

    return NextResponse.json({
      success: true,
      emailId: emailRecord?.id,
      resendEmailId: resendEmailId,
      message: 'Email sent successfully',
      optimalSendTime: sendTimeResult.optimalSendAt,
      note: sendTimeResult.reason,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Admin Email] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      },
      { status: 500 }
    );
  }
}
