import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/analytics/track
 * Track user events (page views, form progress, downloads, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, sessionId, data } = body;

    if (!eventType || !sessionId) {
      return NextResponse.json(
        { error: 'eventType and sessionId are required' },
        { status: 400 }
      );
    }

    // Get user metadata
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

    switch (eventType) {
      case 'page_view':
        await supabaseAdmin.from('page_views').insert({
          session_id: sessionId,
          page_path: data.page,
          referrer: referrer,
          user_agent: userAgent,
          ip_address: ip,
        });
        break;

      case 'lead_started':
        // Check if lead already exists for this session
        const { data: existingLeadStarted } = await supabaseAdmin
          .from('leads')
          .select('id')
          .eq('session_id', sessionId)
          .single();

        if (!existingLeadStarted) {
          // Only insert if not exists
          await supabaseAdmin.from('leads').insert({
            session_id: sessionId,
            status: 'started',
            abandoned_at_step: 1,
          });
        }
        break;

      case 'lead_step1':
        // Check if lead exists for this session
        const { data: existingLead1 } = await supabaseAdmin
          .from('leads')
          .select('id')
          .eq('session_id', sessionId)
          .single();

        if (existingLead1) {
          // Update existing lead
          await supabaseAdmin
            .from('leads')
            .update({
              total_patients: data.totalPatients,
              ticket_medio: data.ticketMedio,
              inactive_percent: data.inactivePercent,
              lost_revenue: data.lostRevenue,
              status: 'step1',
              abandoned_at_step: 1,
            })
            .eq('session_id', sessionId);
        } else {
          // Insert new lead
          await supabaseAdmin.from('leads').insert({
            session_id: sessionId,
            total_patients: data.totalPatients,
            ticket_medio: data.ticketMedio,
            inactive_percent: data.inactivePercent,
            lost_revenue: data.lostRevenue,
            status: 'step1',
            abandoned_at_step: 1,
          });
        }
        break;

      case 'lead_step2':
        // Update existing lead (should always exist after step1)
        await supabaseAdmin
          .from('leads')
          .update({
            clinic_name: data.clinicName,
            name: data.name,
            email: data.email,
            whatsapp: data.whatsapp,
            status: 'step2',
            abandoned_at_step: 2,
          })
          .eq('session_id', sessionId);
        break;

      case 'lead_completed':
        // Update existing lead with all data and mark as completed
        await supabaseAdmin
          .from('leads')
          .update({
            clinic_name: data.clinicName,
            name: data.name,
            email: data.email,
            whatsapp: data.whatsapp,
            total_patients: data.totalPatients,
            ticket_medio: data.ticketMedio,
            inactive_percent: data.inactivePercent,
            lost_revenue: data.lostRevenue,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('session_id', sessionId);
        break;

      case 'download':
        await supabaseAdmin.from('downloads').insert({
          session_id: sessionId,
          email: data.email,
          plan_type: data.planType || 'free',
          license_key: data.licenseKey,
          source_page: data.sourcePage,
        });

        // Track as conversion event
        await supabaseAdmin.from('conversion_events').insert({
          session_id: sessionId,
          event_name: 'CompleteRegistration',
          event_value: 0,
          event_data: { plan_type: data.planType },
        });
        break;

      case 'payment_initiated':
        await supabaseAdmin.from('payment_events').insert({
          session_id: sessionId,
          email: data.email,
          plan_type: data.planType,
          amount: data.amount,
          status: 'initiated',
          payment_provider: 'mercadopago',
        });

        // Track as conversion event
        await supabaseAdmin.from('conversion_events').insert({
          session_id: sessionId,
          event_name: 'InitiateCheckout',
          event_value: data.amount,
          event_data: { plan_type: data.planType },
        });
        break;

      case 'payment_completed':
        await supabaseAdmin.from('payment_events').insert({
          session_id: sessionId,
          email: data.email,
          plan_type: data.planType,
          amount: data.amount,
          status: 'completed',
          payment_provider: 'mercadopago',
          payment_id: data.paymentId,
        });

        // Track as conversion event
        await supabaseAdmin.from('conversion_events').insert({
          session_id: sessionId,
          event_name: 'Purchase',
          event_value: data.amount,
          event_data: { plan_type: data.planType, payment_id: data.paymentId },
        });
        break;

      case 'conversion':
        await supabaseAdmin.from('conversion_events').insert({
          session_id: sessionId,
          event_name: data.eventName,
          event_value: data.value || 0,
          event_data: data.metadata || {},
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid eventType' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics] Track error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
