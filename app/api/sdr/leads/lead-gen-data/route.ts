/**
 * SDR Lead Gen Data API
 *
 * POST /api/sdr/leads/lead-gen-data
 * Fetch complete Lead Gen intelligence data for a specific lead
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSDRById } from '@/lib/sdr-auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  isLeadGenDatabaseConfigured,
  getCompleteLeadGenData,
} from '@/lib/lead-gen-db-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verify SDR
    const authHeader = request.headers.get('authorization');
    const sdrId = authHeader?.replace('Bearer ', '');

    if (!sdrId) {
      return NextResponse.json({ error: 'SDR ID required' }, { status: 401 });
    }

    const sdr = await getSDRById(sdrId);
    if (!sdr || !sdr.is_active) {
      return NextResponse.json(
        { error: 'SDR not found or inactive' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { contactId } = body as { contactId: string };

    if (!contactId) {
      return NextResponse.json(
        { error: 'contactId is required' },
        { status: 400 }
      );
    }

    // Verify the contact belongs to this SDR
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('id, lead_gen_id, assigned_sdr_id, nome, empresa')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // SDRs can only view their own leads (or unassigned leads)
    if (
      contact.assigned_sdr_id &&
      contact.assigned_sdr_id !== sdrId &&
      sdr.role !== 'admin' &&
      sdr.role !== 'manager'
    ) {
      return NextResponse.json(
        { error: 'Access denied - contact not assigned to you' },
        { status: 403 }
      );
    }

    if (!isLeadGenDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: 'Lead Gen database not configured',
        data: null,
      });
    }

    const leadGenId = contact.lead_gen_id || contact.id;
    const lgData = await getCompleteLeadGenData(leadGenId);

    if (!lgData || !lgData.lead) {
      return NextResponse.json({
        success: true,
        connected: true,
        message: 'No Lead Gen data found for this contact',
        data: null,
      });
    }

    // Format response with all Lead Gen intelligence
    return NextResponse.json({
      success: true,
      connected: true,
      data: {
        lead: {
          id: lgData.lead.id,
          business_name: lgData.lead.business_name,
          domain: lgData.lead.domain,
          website: lgData.lead.website,
          phone: lgData.lead.phone,
          best_email: lgData.lead.best_email,
          emails: lgData.lead.emails,
          city: lgData.lead.city,
          state: lgData.lead.state,
          country_code: lgData.lead.country_code,
          full_address: lgData.lead.full_address,
          rating: lgData.lead.rating,
          reviews: lgData.lead.reviews,
          status: lgData.lead.status,
          source: lgData.lead.source,
        },
        campaign: lgData.campaign
          ? {
              name: lgData.campaign.name,
              niche: lgData.campaign.niche,
              location: lgData.campaign.location,
              status: lgData.campaign.status,
            }
          : null,
        enrichment: lgData.enrichment
          ? {
              best_email: lgData.enrichment.best_email,
              emails: lgData.enrichment.emails,
              contact_name: lgData.enrichment.contact_name,
              has_contact_page: lgData.enrichment.has_contact_page,
              has_booking_system: lgData.enrichment.has_booking_system,
              whatsapp_phone: lgData.enrichment.whatsapp_phone,
              found_on_page: lgData.enrichment.found_on_page,
              marketing_tags: lgData.enrichment.marketing_tags,
            }
          : null,
        analysis: lgData.analysis
          ? {
              pain_points: lgData.analysis.pain_points,
              competitor_analysis: lgData.analysis.competitor_analysis,
              ai_email_intro: lgData.analysis.ai_email_intro,
              ai_email_cta: lgData.analysis.ai_email_cta,
              subject_line: lgData.analysis.subject_line,
              personalization_score: lgData.analysis.personalization_score,
              send_time_scheduled: lgData.analysis.send_time_scheduled,
              send_time_reason: lgData.analysis.send_time_reason,
            }
          : null,
        competitors: lgData.competitors.map((c) => ({
          competitor_name: c.competitor_name,
          competitor_website: c.competitor_website,
          competitor_rank: c.competitor_rank,
          competitor_rating: c.competitor_rating,
          gap_analysis: c.gap_analysis,
        })),
        report: lgData.report
          ? {
              pdf_url: lgData.report.pdf_url,
              drive_url: lgData.report.drive_url,
              mockup_url: lgData.report.mockup_url,
              ai_email_intro: lgData.report.ai_email_intro,
            }
          : null,
        qualityScore: lgData.qualityScore
          ? {
              quality_score: lgData.qualityScore.quality_score,
              quality_tier: lgData.qualityScore.quality_tier,
              is_icp: lgData.qualityScore.is_icp,
              scoring_factors: lgData.qualityScore.scoring_factors,
            }
          : null,
        landingPage: lgData.landingPage
          ? {
              slug: lgData.landingPage.slug,
              title: lgData.landingPage.title,
              page_views: lgData.landingPage.page_views,
            }
          : null,
        outreach: lgData.outreach.slice(0, 10).map((o) => ({
          email_to: o.email_to,
          subject: o.subject,
          status: o.status,
          sent_at: o.sent_at,
          opened_at: o.opened_at,
          clicked_at: o.clicked_at,
          open_count: o.open_count,
        })),
        whatsappOutreach: lgData.whatsappOutreach.slice(0, 10).map((w) => ({
          message_type: w.message_type,
          status: w.status,
          sent_at: w.sent_at,
          content: w.content,
        })),
        responses: lgData.responses.map((r) => ({
          channel: r.channel,
          response_text: r.response_text,
          sentiment_score: r.sentiment_score,
          sentiment_label: r.sentiment_label,
          engagement_type: r.engagement_type,
          responded_at: r.responded_at,
        })),
        conversions: lgData.conversions.map((c) => ({
          conversion_type: c.conversion_type,
          conversion_value: c.conversion_value,
          converted_at: c.converted_at,
        })),
        calendarBookings: lgData.calendarBookings.map((b) => ({
          booking_url: b.booking_url,
          booking_status: b.booking_status,
          booked_at: b.booked_at,
          meeting_start: b.meeting_start,
          meeting_end: b.meeting_end,
        })),
        syncStatus: lgData.syncStatus
          ? {
              sync_status: lgData.syncStatus.sync_status,
              sent_at: lgData.syncStatus.sent_at,
              sent_by: lgData.syncStatus.sent_by,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[SDR Lead Gen Data] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Lead Gen data' },
      { status: 500 }
    );
  }
}
