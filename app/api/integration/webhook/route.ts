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
  data: z.any(), // Using z.any() for flexible data structure
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
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:113',message:'handleLeadEnriched entry',data:{hasData:!!data,hasPhone:!!data?.phone},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    // Forward to leads/receive endpoint logic
    // This ensures enriched leads are processed the same way
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const receiveUrl = new URL('/api/integration/leads/receive', baseUrl);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:120',message:'Before fetch to receive endpoint',data:{url:receiveUrl.toString(),hasToken:!!process.env.LEAD_GEN_INTEGRATION_TOKEN},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const response = await fetch(receiveUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LEAD_GEN_INTEGRATION_TOKEN}`,
      },
      body: JSON.stringify(data),
    });

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:133',message:'After fetch response',data:{status:response.status,ok:response.ok,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:138',message:'Fetch failed - response not ok',data:{status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const errorText = await response.text();
      console.error('[Webhook] Failed to forward to leads/receive:', response.status, errorText);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to process enriched lead',
          details: `Received ${response.status} from leads/receive endpoint`
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:152',message:'handleLeadEnriched success',data:{success:result.success,processed:result.processed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    return NextResponse.json(result);
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:157',message:'handleLeadEnriched error caught',data:{errorMessage:error instanceof Error ? error.message : String(error),errorType:error instanceof Error ? error.constructor.name : typeof error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error('[Webhook] Error in handleLeadEnriched:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process enriched lead',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Handle lead.analyzed event
 */
async function handleLeadAnalyzed(data: any) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:135',message:'handleLeadAnalyzed entry',data:{hasPhone:!!data?.phone,hasAnalysis:!!(data?.business_analysis || data?.analysis_summary)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:148',message:'Before query existing lead',data:{normalizedPhone},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      const { data: existingLead, error: queryError } = await supabaseAdmin
        .from('campaign_contacts')
        .select('enrichment_data')
        .eq('phone', normalizedPhone)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid error if not found

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:155',message:'After query existing lead',data:{found:!!existingLead,hasError:!!queryError,errorCode:queryError?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (queryError && queryError.code !== 'PGRST116') {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:160',message:'Query error (not PGRST116)',data:{errorCode:queryError.code,errorMessage:queryError.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        console.error('[Webhook] Error querying lead for analysis:', queryError);
        return NextResponse.json(
          { error: 'Failed to query lead', details: queryError.message },
          { status: 500 }
        );
      }

      const existingEnrichment = existingLead?.enrichment_data || {};
      updateData.enrichment_data = {
        ...existingEnrichment,
        business_analysis: data.business_analysis || data.analysis_summary,
        analysis_summary: data.analysis_summary,
        analyzed_at: new Date().toISOString(),
      };
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:177',message:'Before update lead',data:{normalizedPhone,hasUpdateData:!!updateData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    const { error: updateError } = await supabaseAdmin
      .from('campaign_contacts')
      .update(updateData)
      .eq('phone', normalizedPhone);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:185',message:'After update lead',data:{hasError:!!updateError,errorCode:updateError?.code,rowsAffected:updateError ? 0 : 1},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (updateError) {
      console.error('[Webhook] Error updating lead analysis:', updateError);
      return NextResponse.json(
        { error: 'Failed to update analysis data', details: updateError.message },
        { status: 500 }
      );
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:195',message:'handleLeadAnalyzed success',data:{normalizedPhone},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

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
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:180',message:'handleReportReady entry',data:{hasPhone:!!data?.phone,hasReportUrl:!!data?.report_url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  // Store report URL in database
  if (data.phone && data.report_url) {
    const normalizedPhone = normalizePhone(data.phone);
    
    // Build update object
    const updateData: any = {
      report_url: data.report_url,
    };

    // Also store in enrichment_data for easy access
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:193',message:'Before query existing lead for report',data:{normalizedPhone},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    const { data: existingLead, error: queryError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('enrichment_data')
      .eq('phone', normalizedPhone)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid error if not found

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:200',message:'After query existing lead for report',data:{found:!!existingLead,hasError:!!queryError,errorCode:queryError?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (queryError && queryError.code !== 'PGRST116') {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:205',message:'Query error (not PGRST116)',data:{errorCode:queryError.code,errorMessage:queryError.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('[Webhook] Error querying lead for report:', queryError);
      return NextResponse.json(
        { error: 'Failed to query lead', details: queryError.message },
        { status: 500 }
      );
    }

    const existingEnrichment = existingLead?.enrichment_data || {};
    updateData.enrichment_data = {
      ...existingEnrichment,
      report_url: data.report_url,
      report_ready_at: new Date().toISOString(),
    };

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:220',message:'Before update lead with report',data:{normalizedPhone,hasUpdateData:!!updateData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    const { error } = await supabaseAdmin
      .from('campaign_contacts')
      .update(updateData)
      .eq('phone', normalizedPhone);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:228',message:'After update lead with report',data:{hasError:!!error,errorCode:error?.code,rowsAffected:error ? 0 : 1},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (error) {
      console.error('[Webhook] Error storing report URL:', error);
      return NextResponse.json(
        { error: 'Failed to store report URL', details: error.message },
        { status: 500 }
      );
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:238',message:'handleReportReady success',data:{normalizedPhone,reportUrl:data.report_url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

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
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:255',message:'handleCampaignCompleted entry',data:{hasCampaignId:!!data?.campaign_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  // Update campaign status or trigger next steps
  if (data.campaign_id) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:260',message:'Before update campaign status',data:{campaignId:data.campaign_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    const { error } = await supabaseAdmin
      .from('campaigns')
      .update({ status: 'completed' })
      .eq('id', data.campaign_id);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:267',message:'After update campaign status',data:{hasError:!!error,errorCode:error?.code,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (error) {
      console.error('[Webhook] Error updating campaign status:', error);
      return NextResponse.json(
        { error: 'Failed to update campaign status', details: error.message },
        { status: 500 }
      );
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5b40dd41-a1df-478d-a020-5d0b8f3a73d6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'webhook/route.ts:277',message:'handleCampaignCompleted success',data:{campaignId:data.campaign_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    return NextResponse.json({ success: true, message: 'Campaign marked as completed' });
  }

  return NextResponse.json(
    { error: 'Campaign ID required' },
    { status: 400 }
  );
}
