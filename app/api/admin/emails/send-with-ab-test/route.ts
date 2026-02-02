import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/email-service-simple';
import { getEmailTemplate, renderTemplate } from '@/lib/email-template-service';
import { createABTest, assignVariant } from '@/lib/ab-testing-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const sendABTestEmailSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  variations: z.array(z.object({
    variation_name: z.string(),
    subject: z.string(),
    html_content: z.string(),
    text_content: z.string().optional(),
  })).length(3, 'Must provide exactly 3 variations'),
  testName: z.string().optional(),
  campaignId: z.string().uuid().optional(),
});

/**
 * POST /api/admin/emails/send-with-ab-test
 * Send 3 email variations for A/B testing
 * Creates A/B test, assigns variant, and sends email
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
    const validated = sendABTestEmailSchema.parse(body);

    // Get contact details
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('id, nome, empresa, email, assigned_sdr_id, campaign_id')
      .eq('id', validated.contactId)
      .maybeSingle();

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

    const campaignId = validated.campaignId || contact.campaign_id;

    // Create A/B test for email
    const testName = validated.testName || `Email A/B Test - ${contact.empresa}`;
    const variants = validated.variations.map((v, index) => ({
      name: v.variation_name,
      weight: 33.33, // Equal distribution (will be adjusted to sum to 100)
      content: {
        subject_line: v.subject,
        intro: v.html_content,
        custom: {
          html_content: v.html_content,
          text_content: v.text_content,
        },
      },
    }));

    // Adjust weights to sum to 100
    variants[0].weight = 33.34;
    variants[1].weight = 33.33;
    variants[2].weight = 33.33;

    const testResult = await createABTest({
      campaignId: campaignId || undefined,
      testName,
      description: 'Email A/B test with 3 variations',
      testType: 'combined',
      variants: variants as any,
    });

    if (!testResult.success || !testResult.testId) {
      return NextResponse.json(
        { error: testResult.error || 'Failed to create A/B test' },
        { status: 500 }
      );
    }

    // Start the test
    const { startABTest } = await import('@/lib/ab-testing-service');
    await startABTest(testResult.testId);

    // Assign variant to contact
    const assignment = await assignVariant(testResult.testId, contact.id);

    if (!assignment.success || !assignment.variant) {
      return NextResponse.json(
        { error: assignment.error || 'Failed to assign variant' },
        { status: 500 }
      );
    }

    const selectedVariant = validated.variations.find(
      v => v.variation_name === assignment.variantName
    );

    if (!selectedVariant) {
      return NextResponse.json(
        { error: 'Selected variant not found' },
        { status: 500 }
      );
    }

    // Send email with selected variant
    const fromEmail = process.env.EMAIL_FROM || 'LK Lead Outreach <noreply@lkdigital.org>';
    const replyTo = process.env.EMAIL_REPLY_TO || 'contato@lkdigital.org';

    let resendEmailId: string | null = null;
    try {
      const emailResult = await sendEmail({
        to: contact.email,
        subject: selectedVariant.subject,
        html: selectedVariant.html_content,
        from: fromEmail,
        replyTo: replyTo,
      });

      resendEmailId = emailResult.emailId || null;
    } catch (emailError) {
      console.error('[Admin Email AB Test] Error sending email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email', details: emailError instanceof Error ? emailError.message : String(emailError) },
        { status: 500 }
      );
    }

    // Get admin email
    let adminEmail = replyTo;
    try {
      const { data: firstAdmin } = await supabaseAdmin
        .from('admin_users')
        .select('email')
        .limit(1)
        .single();
      if (firstAdmin?.email) {
        adminEmail = firstAdmin.email;
      }
    } catch (error) {
      // Ignore
    }

    // Create email tracking record with A/B test info
    const { data: emailRecord, error: insertError } = await supabaseAdmin
      .from('email_sends')
      .insert({
        campaign_contact_id: contact.id,
        lead_email: contact.email,
        lead_name: contact.nome,
        lead_company: contact.empresa,
        assigned_sdr_id: contact.assigned_sdr_id,
        subject: selectedVariant.subject,
        html_content: selectedVariant.html_content,
        text_content: selectedVariant.text_content || null,
        from_email: fromEmail,
        reply_to: replyTo,
        resend_email_id: resendEmailId,
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
        is_delivered: true,
        sent_by_admin_email: adminEmail,
        campaign_id: campaignId,
        ab_test_id: testResult.testId,
        ab_test_variant_name: assignment.variantName,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Admin Email AB Test] Error creating email record:', insertError);
    }

    // Track A/B test event
    if (emailRecord) {
      const { trackABTestEvent } = await import('@/lib/ab-testing-service');
      await trackABTestEvent(testResult.testId, contact.id, 'sent', {
        email_send_id: emailRecord.id,
        variant_name: assignment.variantName,
      });

      // Create sent event
      await supabaseAdmin
        .from('email_events')
        .insert({
          email_send_id: emailRecord.id,
          event_type: 'sent',
          event_data: {
            resend_email_id: resendEmailId,
            from: fromEmail,
            to: contact.email,
            ab_test_id: testResult.testId,
            variant_name: assignment.variantName,
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
      campaignId: campaignId || undefined,
      sdrId: contact.assigned_sdr_id || undefined,
      status: 'sent',
    });

    return NextResponse.json({
      success: true,
      emailId: emailRecord?.id,
      resendEmailId: resendEmailId,
      abTestId: testResult.testId,
      variantName: assignment.variantName,
      message: 'Email sent successfully with A/B test',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Admin Email AB Test] Error:', error);
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
