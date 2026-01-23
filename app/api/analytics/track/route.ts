import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateLicenseKey } from '@/lib/license-utils';
import { sendFreeLicenseEmail } from '@/lib/email-service';
import { capiCompleteRegistration } from '@/lib/facebook-capi';

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

        // ✨ NEW: Generate license key and create FREE account
        try {
          // Check if clinic already exists for this email
          const { data: existingClinic } = await supabaseAdmin
            .from('clinics')
            .select('id, license_key, email')
            .eq('email', data.email)
            .single();

          if (!existingClinic) {
            // Generate unique license key
            const licenseKey = generateLicenseKey();
            
            // Create clinic with FREE tier (14-day trial)
            const { data: newClinic, error: clinicError } = await supabaseAdmin
              .from('clinics')
              .insert({
                name: data.name,
                email: data.email,
                phone: data.whatsapp,
                clinic_name: data.clinicName,
                license_key: licenseKey,
                tier: 'FREE',
                verified_at: new Date().toISOString()
              })
              .select()
              .single();

            if (clinicError) {
              console.error('❌ Error creating clinic:', clinicError);
            } else if (newClinic) {
              console.log(`✅ Clinic created: ${newClinic.id} (${data.email})`);

              // Create FREE subscription (14-day trial)
              const trialEndDate = new Date();
              trialEndDate.setDate(trialEndDate.getDate() + 14); // 14 days from now

              await supabaseAdmin
                .from('subscriptions')
                .insert({
                  clinic_id: newClinic.id,
                  tier: 'FREE',
                  status: 'active',
                  billing_cycle: 'trial',
                  amount: 0,
                  current_period_start: new Date().toISOString(),
                  current_period_end: trialEndDate.toISOString()
                });

              console.log(`✅ FREE subscription created for clinic: ${newClinic.id}`);

              // 📧 NOTE: We no longer send the email here. 
              // We wait until they actually click "Download" on the /obrigado page.
              /*
              try {
                await sendFreeLicenseEmail({
                  name: data.name,
                  email: data.email,
                  clinicName: data.clinicName,
                  licenseKey: licenseKey,
                  whatsapp: data.whatsapp
                });
                console.log(`✅ Welcome email sent to: ${data.email}`);
              } catch (emailError) {
                console.error('❌ Error sending welcome email:', emailError);
              }
              */
            }
          } else {
            console.log(`ℹ️ Clinic already exists for email: ${data.email}`);
          }
        } catch (error) {
          console.error('❌ Error in lead completion flow:', error);
          // Don't fail the tracking if clinic/email fails
        }
        break;

      case 'trial_activated':
        // ✨ Send email on trial activation (when they reach /obrigado)
        if (data.email) {
          try {
            const { data: clinic } = await supabaseAdmin
              .from('clinics')
              .select('name, clinic_name, license_key, phone')
              .eq('email', data.email)
              .single();

            if (clinic) {
              await sendFreeLicenseEmail({
                name: clinic.name,
                email: data.email,
                clinicName: clinic.clinic_name,
                licenseKey: clinic.license_key || 'N/A',
                whatsapp: clinic.phone || 'N/A'
              });
              console.log(`✅ Welcome email sent on trial activation to: ${data.email}`);
            }
          } catch (emailError) {
            console.error('❌ Error sending welcome email on trial activation:', emailError);
          }
        }

        // Track as conversion event
        await supabaseAdmin.from('conversion_events').insert({
          session_id: sessionId,
          event_name: 'CompleteRegistration',
          event_value: 0,
          event_data: { plan_type: 'free' },
        });

        // ✨ NEW: Send to Facebook CAPI
        try {
          const url = request.headers.get('referer') || request.url;
          const cookies = request.headers.get('cookie') || '';
          
          await capiCompleteRegistration(
            url,
            userAgent,
            ip,
            cookies,
            'free',
            0,
            data.email
          );
        } catch (capiError) {
          console.error('Failed to send CompleteRegistration to Facebook CAPI:', capiError);
        }
        break;

      case 'download':
        await supabaseAdmin.from('downloads').insert({
          session_id: sessionId,
          email: data.email,
          plan_type: data.planType || 'free',
          license_key: data.licenseKey,
          source_page: data.sourcePage,
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
