/**
 * SDR WhatsApp Variations API
 *
 * POST /api/sdr/whatsapp/generate-variations
 * Generate 3 WhatsApp message variations for a lead
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSDRById } from '@/lib/sdr-auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateWhatsAppVariations } from '@/lib/whatsapp-ai-service';

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
    const { contactId, tone } = body as {
      contactId: string;
      tone?: 'friendly' | 'professional' | 'casual' | 'formal';
    };

    if (!contactId) {
      return NextResponse.json(
        { error: 'contactId is required' },
        { status: 400 }
      );
    }

    // Fetch contact data
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Extract pain points
    let painPoints: string[] = [];
    if (contact.pain_points) {
      if (Array.isArray(contact.pain_points)) {
        painPoints = contact.pain_points;
      } else if (typeof contact.pain_points === 'object') {
        painPoints = Object.entries(contact.pain_points)
          .filter(([, value]) => value === true || value === 'true')
          .map(([key]) => key);
      }
    }
    if (painPoints.length === 0 && contact.dor_especifica) {
      painPoints = [contact.dor_especifica];
    }

    // Extract opportunities
    let opportunities: string[] = [];
    if (contact.opportunities && Array.isArray(contact.opportunities)) {
      opportunities = contact.opportunities;
    }

    // Build input from contact data
    const result = await generateWhatsAppVariations({
      contactId: contact.id,
      nome: contact.nome,
      empresa: contact.empresa,
      cargo: contact.cargo,
      phone: contact.phone,
      site: contact.site,
      niche: contact.niche,
      location: contact.location,
      city: contact.city,
      state: contact.state,
      dor_especifica: contact.dor_especifica,
      pain_points: painPoints,
      opportunities,
      personalized_message: contact.personalized_message,
      business_quality_score: contact.business_quality_score,
      business_quality_tier: contact.business_quality_tier,
      seo_score: contact.seo_score,
      page_score: contact.page_score,
      rating: contact.rating,
      reviews: contact.reviews,
      competitor_count: contact.competitor_count,
      enrichment_data: contact.enrichment_data as Record<string, unknown>,
      lead_gen_id: contact.lead_gen_id,
      sdr_name: sdr.name,
      tone: tone || 'friendly',
    });

    return NextResponse.json({
      success: true,
      variations: result.variations,
      leadGenDataUsed: result.leadGenDataUsed,
      contact: {
        id: contact.id,
        nome: contact.nome,
        empresa: contact.empresa,
        phone: contact.phone,
      },
    });
  } catch (error) {
    console.error('[SDR WhatsApp Variations] Error:', error);

    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate variations' },
      { status: 500 }
    );
  }
}
