import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/webhooks/resend
 * Webhook endpoint for Resend email events (opens, clicks, bounces, etc.)
 * 
 * Configure this URL in Resend dashboard:
 * https://your-domain.com/api/webhooks/resend
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (optional but recommended)
    const signature = request.headers.get('resend-signature');
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      // Verify signature (Resend uses HMAC SHA256)
      const body = await request.text();
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const event = await request.json();
    const { type, data } = event;

    // Find email record by Resend email ID
    const resendEmailId = data?.email_id || data?.email?.id;
    if (!resendEmailId) {
      console.warn('[Resend Webhook] No email ID in event:', event);
      return NextResponse.json({ received: true });
    }

    const { data: emailRecord } = await supabaseAdmin
      .from('email_sends')
      .select('id, open_count, click_count, first_opened_at, last_opened_at, first_clicked_at, last_clicked_at, clicked_urls')
      .eq('resend_email_id', resendEmailId)
      .single();

    if (!emailRecord) {
      console.warn('[Resend Webhook] Email record not found for:', resendEmailId);
      return NextResponse.json({ received: true });
    }

    const now = new Date().toISOString();
    const updates: any = {};
    const eventData: any = {
      resend_email_id: resendEmailId,
      ...data,
    };

    // Handle different event types
    switch (type) {
      case 'email.delivered':
        updates.delivered_at = now;
        updates.is_delivered = true;
        break;

      case 'email.opened':
        updates.is_opened = true;
        updates.open_count = (emailRecord.open_count || 0) + 1;
        if (!emailRecord.first_opened_at) {
          updates.first_opened_at = now;
        }
        updates.last_opened_at = now;
        updates.opened_at = now;
        eventData.user_agent = data?.user_agent;
        eventData.ip_address = data?.ip_address;
        eventData.location = data?.location;
        break;

      case 'email.clicked':
        updates.is_clicked = true;
        updates.click_count = (emailRecord.click_count || 0) + 1;
        if (!emailRecord.first_clicked_at) {
          updates.first_clicked_at = now;
        }
        updates.last_clicked_at = now;
        updates.clicked_at = now;
        
        // Track clicked URL
        const clickedUrl = data?.link || data?.url;
        if (clickedUrl) {
          const currentUrls = emailRecord.clicked_urls || [];
          if (!currentUrls.includes(clickedUrl)) {
            updates.clicked_urls = [...currentUrls, clickedUrl];
          }
        }
        
        eventData.clicked_url = clickedUrl;
        eventData.user_agent = data?.user_agent;
        eventData.ip_address = data?.ip_address;
        eventData.location = data?.location;
        break;

      case 'email.bounced':
        updates.is_bounced = true;
        updates.bounced_at = now;
        eventData.bounce_type = data?.bounce_type;
        eventData.bounce_reason = data?.bounce_reason;
        break;

      case 'email.complained':
        updates.is_complained = true;
        updates.complaint_at = now;
        break;

      default:
        // Unknown event type - just log it
        console.log('[Resend Webhook] Unknown event type:', type);
        return NextResponse.json({ received: true });
    }

    // Update email record
    await supabaseAdmin
      .from('email_sends')
      .update(updates)
      .eq('id', emailRecord.id);

    // Create event record
    await supabaseAdmin
      .from('email_events')
      .insert({
        email_send_id: emailRecord.id,
        event_type: type.replace('email.', ''), // 'opened', 'clicked', etc.
        event_data: eventData,
        clicked_url: eventData.clicked_url || null,
        user_agent: eventData.user_agent || null,
        ip_address: eventData.ip_address || null,
        location_data: eventData.location || null,
        occurred_at: now,
      });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Resend Webhook] Error:', error);
    // Always return 200 to prevent Resend from retrying
    return NextResponse.json({ received: true });
  }
}
