import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/email-service-simple';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Email send request schema
const sendEmailSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  subject: z.string().min(1, 'Subject is required').optional(), // Optional if using template
  htmlContent: z.string().min(1, 'HTML content is required').optional(), // Optional if using template
  textContent: z.string().optional(),
  fromEmail: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  // Template support
  templateId: z.string().uuid().optional(),
  templateVariables: z.record(z.string(), z.string()).optional(), // For template variable substitution
  // A/B Testing support
  abTestId: z.string().uuid().optional(), // If sending as part of A/B test
  abTestVariantName: z.string().optional(), // Which variant to send
  // Send all 3 variations for A/B testing
  sendABTestVariations: z.boolean().optional(), // If true, send all 3 variations
  variations: z.array(z.object({
    variation_name: z.string(),
    subject: z.string(),
    html_content: z.string(),
    text_content: z.string().optional(),
  })).optional(), // 3 variations for A/B testing
}).refine(
  (data) => {
    // Must have either (subject + htmlContent) OR templateId OR variations
    return (data.subject && data.htmlContent) || data.templateId || (data.variations && data.variations.length > 0);
  },
  { message: 'Must provide subject+htmlContent, templateId, or variations' }
);

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

    // Get contact details (including analysis_image_url)
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('id, nome, empresa, email, assigned_sdr_id, campaign_id, analysis_image_url, report_url')
      .eq('id', validated.contactId)
      .maybeSingle(); // Use maybeSingle() to handle not found gracefully

    if (contactError) {
      console.error('[Admin Email] Error fetching contact:', contactError);
      return NextResponse.json(
        { error: 'Database error fetching contact', details: contactError.message },
        { status: 500 }
      );
    }

    if (!contact) {
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
    const { canContactLead, DEFAULT_HUMAN_BEHAVIOR_SETTINGS, isWithinWorkingHours } = await import('@/lib/human-behavior-service');
    const { shouldSkipDay } = await import('@/lib/send-time-service');
    
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

    // FAILSAFE: Check system time/date before sending
    
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // FAILSAFE 1: Never send on weekends (using system time)
    if (shouldSkipDay(dayOfWeek)) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return NextResponse.json(
        {
          error: 'Weekend restriction',
          message: `Cannot send on ${dayNames[dayOfWeek]}. Outreach is only allowed Monday-Friday.`,
          currentDay: dayNames[dayOfWeek],
          currentTime: `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`,
        },
        { status: 403 } // Forbidden
      );
    }
    
    // FAILSAFE 2: Check working hours (using system time)
    if (!isWithinWorkingHours(DEFAULT_HUMAN_BEHAVIOR_SETTINGS, now)) {
      return NextResponse.json(
        {
          error: 'Outside working hours',
          message: `Current time (${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}) is outside working hours (${DEFAULT_HUMAN_BEHAVIOR_SETTINGS.startTime} - ${DEFAULT_HUMAN_BEHAVIOR_SETTINGS.endTime}).`,
          currentTime: `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`,
          workingHours: `${DEFAULT_HUMAN_BEHAVIOR_SETTINGS.startTime} - ${DEFAULT_HUMAN_BEHAVIOR_SETTINGS.endTime}`,
        },
        { status: 403 } // Forbidden
      );
    }
    
    // Check optimal send time (skip weekends, limit Mon/Fri) - for logging/recommendation
    const { calculateOptimalSendTime } = await import('@/lib/send-time-service');
    const sendTimeResult = await calculateOptimalSendTime({
      contactId: contact.id,
      businessType: 'general',
      leadPriority: 'MEDIUM',
      timezone: 'America/Sao_Paulo',
    });
    
    // Log optimal time (but allow immediate send since we already passed failsafe checks)
    
    // Handle template, variations, or direct send
    let finalSubject: string;
    let finalHtml: string;
    let finalText: string | undefined;
    let templateId: string | undefined;
    let abTestId: string | undefined;
    let abTestVariantName: string | undefined;

    // Case 1: Using template
    if (validated.templateId) {
      const { getEmailTemplate, renderTemplate } = await import('@/lib/email-template-service');
      const template = await getEmailTemplate(validated.templateId);
      
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      // Prepare variables (merge contact data with provided variables)
      const variables = {
        nome: contact.nome || '',
        empresa: contact.empresa || '',
        ...validated.templateVariables,
      };

      const rendered = renderTemplate(template, variables);
      finalSubject = rendered.subject;
      finalHtml = rendered.html;
      finalText = rendered.text;
      templateId = validated.templateId;
    }
    // Case 2: Direct send (subject + htmlContent)
    else if (validated.subject && validated.htmlContent) {
      finalSubject = validated.subject;
      
      // Automatically include analysis image if available
      let htmlWithImage = validated.htmlContent;
      if (contact.analysis_image_url) {
        // Insert image before closing body tag or at the end
        const imageHtml = `
          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <h3 style="color: #1e293b; margin-bottom: 15px; font-size: 18px;">📊 Análise Visual Personalizada</h3>
            <img src="${contact.analysis_image_url}" 
                 alt="Análise Digital - ${contact.empresa || contact.nome}" 
                 style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
            <div style="margin-top: 15px;">
              <a href="${contact.analysis_image_url}" 
                 style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Ver Análise Completa
              </a>
            </div>
          </div>
        `;
        
        // Try to insert before closing body tag, otherwise append
        if (htmlWithImage.includes('</body>')) {
          htmlWithImage = htmlWithImage.replace('</body>', `${imageHtml}</body>`);
        } else {
          htmlWithImage = htmlWithImage + imageHtml;
        }
      } else if (contact.report_url) {
        // Fallback to report URL if no image
        const reportHtml = `
          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <a href="${contact.report_url}" 
               style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
              📄 Ver Relatório Completo
            </a>
          </div>
        `;
        
        if (htmlWithImage.includes('</body>')) {
          htmlWithImage = htmlWithImage.replace('</body>', `${reportHtml}</body>`);
        } else {
          htmlWithImage = htmlWithImage + reportHtml;
        }
      }
      
      finalHtml = htmlWithImage;
      finalText = validated.textContent;
    }
    // Case 3: A/B test variations (should use send-with-ab-test endpoint)
    else {
      return NextResponse.json(
        { error: 'Must provide subject+htmlContent, templateId, or use /send-with-ab-test endpoint for variations' },
        { status: 400 }
      );
    }

    // Send email via Resend
    const fromEmail = validated.fromEmail || process.env.EMAIL_FROM || 'LK Lead Outreach <noreply@lkdigital.org>';
    const replyTo = validated.replyTo || process.env.EMAIL_REPLY_TO || 'contato@lkdigital.org';

    let resendEmailId: string | null = null;
    try {
      const emailResult = await sendEmail({
        to: contact.email,
        subject: finalSubject,
        html: finalHtml,
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

    // Handle A/B test if provided
    if (validated.abTestId && validated.abTestVariantName) {
      abTestId = validated.abTestId;
      abTestVariantName = validated.abTestVariantName;
    }

    // Get admin email - use replyTo or query first admin user
    let adminEmail = replyTo; // Default to replyTo email
    try {
      // Try to get first admin user's email for tracking
      const { data: firstAdmin } = await supabaseAdmin
        .from('admin_users')
        .select('email')
        .limit(1)
        .single();
      if (firstAdmin?.email) {
        adminEmail = firstAdmin.email;
      }
    } catch (error) {
      // If query fails, use replyTo as fallback
      console.warn('[Admin Email] Could not fetch admin email, using replyTo:', replyTo);
    }

    // Create email tracking record
    const { data: emailRecord, error: insertError } = await supabaseAdmin
      .from('email_sends')
      .insert({
        campaign_contact_id: contact.id,
        lead_email: contact.email,
        lead_name: contact.nome,
        lead_company: contact.empresa,
        assigned_sdr_id: contact.assigned_sdr_id,
        subject: finalSubject,
        html_content: finalHtml,
        text_content: finalText || null,
        email_template_id: templateId || null,
        ab_test_id: abTestId || null,
        ab_test_variant_name: abTestVariantName || null,
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
