import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/email-service-simple';
import { normalizePhone } from '@/lib/phone';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Webhook event types
const webhookEventSchema = z.object({
  event_type: z.enum([
    'lead.enriched',
    'lead.analyzed',
    'lead.report_ready',
    'lead.email_sent',
    'campaign.completed',
  ]),
  lead_id: z.string().optional(),
  data: z.record(z.string(), z.any()),
  timestamp: z.string().optional(),
});

/**
 * POST /api/integration/webhook
 * 
 * Webhook endpoint for real-time updates from Lead Generation Tool
 * 
 * Events:
 * - lead.enriched: New enriched lead ready
 * - lead.analyzed: Business analysis complete
 * - lead.report_ready: Report generated
 * - lead.email_sent: Email sent by lead gen tool
 * - campaign.completed: Campaign finished
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const expectedToken = process.env.LEAD_GEN_INTEGRATION_TOKEN;

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Integration not configured' },
        { status: 503 }
      );
    }

    if (!token || token !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const event = webhookEventSchema.parse(body);

    console.log(`[Webhook] Received event: ${event.event_type}`, event.data);

    // Handle different event types
    switch (event.event_type) {
      case 'lead.enriched':
        return await handleLeadEnriched(event.data);
      
      case 'lead.analyzed':
        return await handleLeadAnalyzed(event.data);
      
      case 'lead.report_ready':
        return await handleReportReady(event.data);
      
      case 'lead.email_sent':
        return await handleEmailSent(event.data);
      
      case 'campaign.completed':
        return await handleCampaignCompleted(event.data);
      
      default:
        return NextResponse.json(
          { error: 'Unknown event type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Webhook] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid webhook payload',
          details: error.issues,
        },
        { status: 400 }
      );
    }

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

/**
 * Handle lead.enriched event
 */
async function handleLeadEnriched(data: any) {
  // Forward to leads/receive endpoint logic
  // This ensures enriched leads are processed the same way
  const response = await fetch(
    new URL('/api/integration/leads/receive', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LEAD_GEN_INTEGRATION_TOKEN}`,
      },
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();
  return NextResponse.json(result);
}

/**
 * Handle lead.analyzed event
 */
async function handleLeadAnalyzed(data: any) {
  // Update lead with analysis data
  if (data.phone) {
    const normalizedPhone = normalizePhone(data.phone);
    
    // Build update object
    const updateData: any = {
      personalized_message: data.business_analysis || data.analysis_summary,
    };

    // Update enrichment_data JSONB if it exists
    if (data.business_analysis || data.analysis_summary) {
      // Get existing enrichment_data and merge
      const { data: existingLead } = await supabaseAdmin
        .from('campaign_contacts')
        .select('enrichment_data')
        .eq('phone', normalizedPhone)
        .single();

      const existingEnrichment = existingLead?.enrichment_data || {};
      updateData.enrichment_data = {
        ...existingEnrichment,
        business_analysis: data.business_analysis || data.analysis_summary,
        analysis_summary: data.analysis_summary,
        analyzed_at: new Date().toISOString(),
      };
    }

    await supabaseAdmin
      .from('campaign_contacts')
      .update(updateData)
      .eq('phone', normalizedPhone);

    return NextResponse.json({ success: true, message: 'Analysis data updated' });
  }

  return NextResponse.json(
    { error: 'Phone required' },
    { status: 400 }
  );
}

/**
 * Handle report_ready event
 */
async function handleReportReady(data: any) {
  // Store report URL in database
  if (data.phone && data.report_url) {
    const normalizedPhone = normalizePhone(data.phone);
    
    // Build update object
    const updateData: any = {
      report_url: data.report_url,
    };

    // Also store in enrichment_data for easy access
    const { data: existingLead } = await supabaseAdmin
      .from('campaign_contacts')
      .select('enrichment_data')
      .eq('phone', normalizedPhone)
      .single();

    const existingEnrichment = existingLead?.enrichment_data || {};
    updateData.enrichment_data = {
      ...existingEnrichment,
      report_url: data.report_url,
      report_ready_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from('campaign_contacts')
      .update(updateData)
      .eq('phone', normalizedPhone);

    if (error) {
      console.error('[Webhook] Error storing report URL:', error);
      return NextResponse.json(
        { error: 'Failed to store report URL', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Webhook] Report URL stored for:', normalizedPhone);
    return NextResponse.json({ 
      success: true, 
      message: 'Report URL stored',
      report_url: data.report_url 
    });
  }

  return NextResponse.json(
    { error: 'Phone and report_url required' },
    { status: 400 }
  );
}

/**
 * Handle email_sent event
 */
async function handleEmailSent(data: any) {
  // Mark email as sent, update lead status
  if (data.phone) {
    const normalizedPhone = normalizePhone(data.phone);
    
    // Could create an email_tracking table to track email sends
    // For now, just log it
    console.log('[Webhook] Email sent to:', data.email);
    
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: 'Phone required' },
    { status: 400 }
  );
}

/**
 * Handle campaign_completed event
 */
async function handleCampaignCompleted(data: any) {
  // Update campaign status or trigger next steps
  if (data.campaign_id) {
    await supabaseAdmin
      .from('campaigns')
      .update({ status: 'completed' })
      .eq('id', data.campaign_id);

    return NextResponse.json({ success: true, message: 'Campaign marked as completed' });
  }

  return NextResponse.json(
    { error: 'Campaign ID required' },
    { status: 400 }
  );
}
