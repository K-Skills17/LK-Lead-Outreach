import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/email-service-simple';
import { normalizePhone } from '@/lib/phone';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for enriched lead from lead gen tool
const enrichedLeadSchema = z.object({
  // Lead information
  nome: z.string().min(1, 'Nome is required'),
  empresa: z.string().min(1, 'Empresa is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  
  // Enrichment data
  cargo: z.string().optional(),
  site: z.string().url().optional().or(z.literal('')),
  dor_especifica: z.string().optional(),
  
  // Analysis data from lead gen tool
  industry: z.string().optional(),
  company_size: z.string().optional(),
  revenue_range: z.string().optional(),
  pain_points: z.array(z.string()).optional(),
  business_analysis: z.string().optional(),
  enrichment_score: z.number().min(0).max(100).optional(),
  
  // Metadata
  source: z.string().optional(),
  campaign_name: z.string().optional(),
  tags: z.array(z.string()).optional(),
  
  // Workflow options
  send_email_first: z.boolean().default(true),
  email_template: z.string().optional(),
  whatsapp_followup_delay_hours: z.number().default(24).optional(),
});

/**
 * POST /api/integration/leads/receive
 * 
 * Receive enriched leads from Lead Generation Tool
 * 
 * This endpoint:
 * 1. Receives enriched lead data
 * 2. Creates/updates lead in database
 * 3. Sends initial email (if requested)
 * 4. Queues for WhatsApp follow-up
 * 
 * Authentication: Bearer token (shared secret)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const expectedToken = process.env.LEAD_GEN_INTEGRATION_TOKEN;

    if (!expectedToken) {
      console.error('[Integration] LEAD_GEN_INTEGRATION_TOKEN not configured');
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
    
    // Handle single lead or array of leads
    const leads = Array.isArray(body) ? body : [body];
    
    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      emails_sent: 0,
      errors: [] as string[],
    };

    for (const leadData of leads) {
      try {
        // Validate lead data
        const validated = enrichedLeadSchema.parse(leadData);

        // Normalize phone
        const normalizedPhone = normalizePhone(validated.phone);

        // Check if phone is blocked
        const { data: blocked } = await supabaseAdmin
          .from('do_not_contact')
          .select('id')
          .eq('phone', normalizedPhone)
          .single();

        if (blocked) {
          results.errors.push(`Phone ${validated.phone} is blocked`);
          continue;
        }

        // Find or create campaign
        let campaignId: string;
        const campaignName = validated.campaign_name || `Auto-${new Date().toISOString().split('T')[0]}`;
        
        const { data: existingCampaign } = await supabaseAdmin
          .from('campaigns')
          .select('id')
          .eq('name', campaignName)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingCampaign) {
          campaignId = existingCampaign.id;
        } else {
          // Create default clinic if needed
          const { data: defaultClinic } = await supabaseAdmin
            .from('clinics')
            .select('id')
            .limit(1)
            .single();

          let clinicId = defaultClinic?.id;

          if (!clinicId) {
            const { data: newClinic } = await supabaseAdmin
              .from('clinics')
              .insert({
                email: 'integration@lkdigital.org',
                clinic_name: 'Lead Gen Integration',
                tier: 'FREE',
              })
              .select('id')
              .single();

            clinicId = newClinic?.id;
          }

          const { data: newCampaign } = await supabaseAdmin
            .from('campaigns')
            .insert({
              clinic_id: clinicId,
              name: campaignName,
              status: 'active',
            })
            .select('id')
            .single();

          campaignId = newCampaign?.id;
        }

        // Check if lead already exists in this campaign
        const { data: existingLead } = await supabaseAdmin
          .from('campaign_contacts')
          .select('id')
          .eq('campaign_id', campaignId)
          .eq('phone', normalizedPhone)
          .single();

        // Calculate scheduled send time for WhatsApp (respect delay)
        const delayHours = validated.whatsapp_followup_delay_hours || 24;
        const scheduledSendAt = new Date();
        scheduledSendAt.setHours(scheduledSendAt.getHours() + delayHours);

        // Prepare enrichment data as JSONB
        const enrichmentData: Record<string, any> = {};
        if (validated.industry) enrichmentData.industry = validated.industry;
        if (validated.company_size) enrichmentData.company_size = validated.company_size;
        if (validated.revenue_range) enrichmentData.revenue_range = validated.revenue_range;
        if (validated.pain_points && validated.pain_points.length > 0) enrichmentData.pain_points = validated.pain_points;
        if (validated.enrichment_score !== undefined) enrichmentData.enrichment_score = validated.enrichment_score;
        if (validated.source) enrichmentData.source = validated.source;
        if (validated.tags && validated.tags.length > 0) enrichmentData.tags = validated.tags;
        if (validated.business_analysis) enrichmentData.business_analysis = validated.business_analysis;

        // Prepare lead data with all enrichment fields
        const leadToUpsert: any = {
          campaign_id: campaignId,
          name: validated.nome, // Backward compatibility
          nome: validated.nome,
          empresa: validated.empresa,
          cargo: validated.cargo || null,
          site: validated.site || null,
          dor_especifica: validated.dor_especifica || null,
          phone: normalizedPhone,
          email: validated.email || null,
          status: 'pending' as const,
          personalized_message: validated.business_analysis || null,
          // Store all enrichment fields
          industry: validated.industry || null,
          company_size: validated.company_size || null,
          revenue_range: validated.revenue_range || null,
          pain_points: validated.pain_points && validated.pain_points.length > 0 ? validated.pain_points : null,
          enrichment_score: validated.enrichment_score || null,
          source: validated.source || null,
          tags: validated.tags && validated.tags.length > 0 ? validated.tags : null,
          enrichment_data: Object.keys(enrichmentData).length > 0 ? enrichmentData : null,
          scheduled_send_at: scheduledSendAt.toISOString(),
        };

        let leadId: string;

        if (existingLead) {
          // Update existing lead
          const { data: updated } = await supabaseAdmin
            .from('campaign_contacts')
            .update(leadToUpsert)
            .eq('id', existingLead.id)
            .select('id')
            .single();

          leadId = updated?.id || existingLead.id;
          results.updated++;
        } else {
          // Create new lead
          const { data: created } = await supabaseAdmin
            .from('campaign_contacts')
            .insert(leadToUpsert)
            .select('id')
            .single();

          leadId = created?.id;
          results.created++;
        }

        // Send email if requested
        if (validated.send_email_first && validated.email) {
          try {
            await sendEmail({
              to: validated.email,
              subject: validated.email_template || `Oportunidade para ${validated.empresa}`,
              html: `
                <h2>Olá ${validated.nome}!</h2>
                <p>Vi que você trabalha na ${validated.empresa} como ${validated.cargo || 'profissional'}.</p>
                ${validated.dor_especifica ? `<p>Entendo que vocês estão enfrentando: ${validated.dor_especifica}</p>` : ''}
                <p>Gostaria de uma conversa rápida para mostrar como podemos ajudar?</p>
                <p>Atenciosamente,<br>Equipe LK Digital</p>
              `,
            });
            results.emails_sent++;
          } catch (emailError) {
            console.error('[Integration] Email error:', emailError);
            results.errors.push(`Failed to send email to ${validated.email}`);
          }
        }

        results.processed++;
      } catch (error) {
        const errorMsg = error instanceof z.ZodError
          ? `Validation error: ${error.issues.map(e => e.message).join(', ')}`
          : error instanceof Error
          ? error.message
          : 'Unknown error';

        results.errors.push(errorMsg);
        console.error('[Integration] Error processing lead:', error);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${results.processed} leads`,
    });
  } catch (error) {
    console.error('[Integration] Error:', error);
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
