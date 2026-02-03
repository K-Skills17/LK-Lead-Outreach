import { NextRequest, NextResponse } from 'next/server';
import { getCompleteLeadGenData, mergeLeadGenDataIntoContact } from '@/lib/lead-gen-db-service';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/leads/[leadId]/lead-gen-data
 * Fetch and merge Lead Gen Tool data for a contact
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;

    // Get contact from campaign_contacts
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('*')
      .eq('id', leadId)
      .maybeSingle();

    if (contactError) {
      console.error('[LeadGenData] Error fetching contact:', contactError);
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Try to get lead_gen_id from contact
    const leadGenId = (contact as any)?.lead_gen_id || contact?.id;

    // Get complete Lead Gen Tool data
    const leadGenData = await getCompleteLeadGenData(leadGenId);

    if (!leadGenData || !leadGenData.lead) {
      return NextResponse.json({
        success: false,
        message: 'No Lead Gen Tool data found for this lead',
        contact: contact,
      });
    }

    // Merge the data
    const mergedContact = mergeLeadGenDataIntoContact(contact, leadGenData);

    return NextResponse.json({
      success: true,
      contact: mergedContact,
      leadGenData: {
        lead: leadGenData.lead,
        enrichment: leadGenData.enrichment,
        analysis: leadGenData.analysis,
        competitors: leadGenData.competitors,
        report: leadGenData.report,
        landingPage: leadGenData.landingPage,
        qualityScore: leadGenData.qualityScore,
      },
    });
  } catch (error) {
    console.error('[LeadGenData] Error:', error);
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
 * POST /api/leads/[leadId]/lead-gen-data
 * Sync and update contact with Lead Gen Tool data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;

    // Get contact
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('*')
      .eq('id', leadId)
      .maybeSingle();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Get Lead Gen Tool data
    const leadGenId = (contact as any)?.lead_gen_id || contact?.id;
    const leadGenData = await getCompleteLeadGenData(leadGenId);

    if (!leadGenData || !leadGenData.lead) {
      return NextResponse.json(
        { error: 'No Lead Gen Tool data found' },
        { status: 404 }
      );
    }

    // Merge and update contact
    const mergedContact = mergeLeadGenDataIntoContact(contact, leadGenData);

    // Update contact in database
    const { data: updatedContact, error: updateError } = await supabaseAdmin
      .from('campaign_contacts')
      .update(mergedContact)
      .eq('id', leadId)
      .select()
      .single();

    if (updateError) {
      console.error('[LeadGenData] Error updating contact:', updateError);
      return NextResponse.json(
        { error: 'Failed to update contact' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contact updated with Lead Gen Tool data',
      contact: updatedContact,
    });
  } catch (error) {
    console.error('[LeadGenData] Error:', error);
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
