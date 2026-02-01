import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/email-service-simple';
import { normalizePhone } from '@/lib/phone';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for enriched lead from lead gen tool
const enrichedLeadSchema = z.object({
  // Required fields
  nome: z.string().min(1, 'Nome is required'),
  empresa: z.string().min(1, 'Empresa is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  
  // Business information
  cargo: z.string().optional(),
  site: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zip_code: z.string().optional(),
  dor_especifica: z.string().optional(),
  
  // Enrichment data (all emails, contacts, tags)
  all_emails: z.array(z.string().email()).optional(),
  whatsapp: z.string().optional(),
  contact_names: z.array(z.string()).optional(),
  marketing_tags: z.array(z.string()).optional(),
  
  // Analysis data
  industry: z.string().optional(),
  company_size: z.string().optional(),
  revenue_range: z.string().optional(),
  pain_points: z.array(z.string()).optional(),
  business_analysis: z.string().optional(),
  competitor_analysis: z.string().optional(),
  enrichment_score: z.number().min(0).max(100).optional(),
  quality_score: z.number().min(0).max(100).optional(),
  fit_score: z.number().min(0).max(100).optional(),
  
  // Reports & personalization
  report_url: z.string().url().optional(),
  landing_page_url: z.string().url().optional(),
  personalization_data: z.any().optional(),
  
  // Outreach history
  outreach_history: z.object({
    emails_sent: z.array(z.any()).optional(),
    whatsapp_messages: z.array(z.any()).optional(),
  }).optional(),
  
  // Campaign context
  campaign_name: z.string().optional(),
  campaign_id: z.string().optional(),
  niche: z.string().optional(),
  location: z.string().optional(),
  campaign_settings: z.any().optional(),
  
  // Metadata
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  lead_id: z.string().optional(),
  created_at: z.string().optional(),
  enriched_at: z.string().optional(),
  
  // Workflow options
  send_email_first: z.boolean().default(true),
  email_template: z.string().optional(),
  whatsapp_followup_delay_hours: z.number().default(24).optional(),
  auto_assign_sdr: z.boolean().default(false).optional(),
  sdr_email: z.string().email().optional(),
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
          console.log(`[Integration] Using existing campaign ${campaignId}: ${campaignName}`);
        } else {
          // Create default clinic if needed
          const { data: defaultClinic, error: clinicError } = await supabaseAdmin
            .from('clinics')
            .select('id')
            .limit(1)
            .single();

          let clinicId = defaultClinic?.id;

          if (!clinicId) {
            const { data: newClinic, error: newClinicError } = await supabaseAdmin
              .from('clinics')
              .insert({
                email: 'integration@lkdigital.org',
                clinic_name: 'Lead Gen Integration',
                tier: 'FREE',
              })
              .select('id')
              .single();

            if (newClinicError) {
              console.error('[Integration] ❌ Error creating clinic:', newClinicError);
              results.errors.push(`Failed to create clinic: ${newClinicError.message}`);
              continue;
            }

            clinicId = newClinic?.id;
            if (!clinicId) {
              console.error('[Integration] ❌ Failed to get clinic ID after creation');
              results.errors.push(`Failed to create clinic for ${validated.nome}`);
              continue;
            }
            console.log(`[Integration] ✅ Created clinic ${clinicId}`);
          }

          const { data: newCampaign, error: campaignError } = await supabaseAdmin
            .from('campaigns')
            .insert({
              clinic_id: clinicId,
              name: campaignName,
              status: 'active',
            })
            .select('id')
            .single();

          if (campaignError) {
            console.error('[Integration] ❌ Error creating campaign:', campaignError);
            console.error('[Integration] Campaign data:', { clinic_id: clinicId, name: campaignName });
            results.errors.push(`Failed to create campaign ${campaignName}: ${campaignError.message}`);
            continue;
          }

          campaignId = newCampaign?.id;
          if (!campaignId) {
            console.error('[Integration] ❌ Failed to get campaign ID after creation');
            results.errors.push(`Failed to create campaign for ${validated.nome}`);
            continue;
          }
          console.log(`[Integration] ✅ Created campaign ${campaignId}: ${campaignName}`);
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

        // Prepare enrichment data as JSONB - store ALL data from lead gen tool
        const enrichmentData: Record<string, any> = {};
        
        // Business info
        if (validated.address) enrichmentData.address = validated.address;
        if (validated.city) enrichmentData.city = validated.city;
        if (validated.state) enrichmentData.state = validated.state;
        if (validated.country) enrichmentData.country = validated.country;
        if (validated.zip_code) enrichmentData.zip_code = validated.zip_code;
        
        // Enrichment data
        if (validated.all_emails && validated.all_emails.length > 0) enrichmentData.all_emails = validated.all_emails;
        if (validated.whatsapp) enrichmentData.whatsapp = validated.whatsapp;
        if (validated.contact_names && validated.contact_names.length > 0) enrichmentData.contact_names = validated.contact_names;
        if (validated.marketing_tags && validated.marketing_tags.length > 0) enrichmentData.marketing_tags = validated.marketing_tags;
        
        // Analysis data
        if (validated.industry) enrichmentData.industry = validated.industry;
        if (validated.company_size) enrichmentData.company_size = validated.company_size;
        if (validated.revenue_range) enrichmentData.revenue_range = validated.revenue_range;
        if (validated.pain_points && validated.pain_points.length > 0) enrichmentData.pain_points = validated.pain_points;
        if (validated.business_analysis) enrichmentData.business_analysis = validated.business_analysis;
        if (validated.competitor_analysis) enrichmentData.competitor_analysis = validated.competitor_analysis;
        if (validated.enrichment_score !== undefined) enrichmentData.enrichment_score = validated.enrichment_score;
        if (validated.quality_score !== undefined) enrichmentData.quality_score = validated.quality_score;
        if (validated.fit_score !== undefined) enrichmentData.fit_score = validated.fit_score;
        
        // Reports & personalization
        if (validated.landing_page_url) enrichmentData.landing_page_url = validated.landing_page_url;
        if (validated.personalization_data) enrichmentData.personalization_data = validated.personalization_data;
        
        // Outreach history
        if (validated.outreach_history) enrichmentData.outreach_history = validated.outreach_history;
        
        // Campaign context
        if (validated.campaign_id) enrichmentData.campaign_id = validated.campaign_id;
        if (validated.niche) enrichmentData.niche = validated.niche;
        if (validated.location) enrichmentData.location = validated.location;
        if (validated.campaign_settings) enrichmentData.campaign_settings = validated.campaign_settings;
        
        // Metadata
        if (validated.source) enrichmentData.source = validated.source;
        if (validated.tags && validated.tags.length > 0) enrichmentData.tags = validated.tags;
        if (validated.lead_id) enrichmentData.lead_id = validated.lead_id;
        if (validated.created_at) enrichmentData.created_at = validated.created_at;
        if (validated.enriched_at) enrichmentData.enriched_at = validated.enriched_at;

        // Handle SDR auto-assignment if requested
        let assignedSdrId: string | undefined = undefined;
        if (validated.auto_assign_sdr && validated.sdr_email) {
          try {
            const { getSDRByEmail } = await import('@/lib/sdr-auth');
            const sdr = await getSDRByEmail(validated.sdr_email);
            if (sdr) {
              assignedSdrId = sdr.id;
            }
          } catch (error) {
            console.error('[Integration] Error assigning SDR:', error);
            // Continue without assignment if SDR lookup fails
          }
        }

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
          report_url: validated.report_url || null,
          enrichment_data: Object.keys(enrichmentData).length > 0 ? enrichmentData : null,
          scheduled_send_at: scheduledSendAt.toISOString(),
          assigned_sdr_id: assignedSdrId || null,
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
          const { data: created, error: insertError } = await supabaseAdmin
            .from('campaign_contacts')
            .insert(leadToUpsert)
            .select('id')
            .single();

          if (insertError) {
            console.error('[Integration] ❌ Error inserting lead:', insertError);
            console.error('[Integration] Lead data:', JSON.stringify(leadToUpsert, null, 2));
            console.error('[Integration] Campaign ID:', campaignId);
            results.errors.push(`Failed to create lead for ${validated.nome}: ${insertError.message}`);
            continue;
          }

          leadId = created?.id;
          
          if (!leadId) {
            console.error('[Integration] ❌ Failed to get lead ID after creation');
            console.error('[Integration] Insert response:', { created, insertError });
            results.errors.push(`Failed to create lead for ${validated.nome} - no ID returned`);
            continue;
          }
          
          results.created++;
          console.log(`[Integration] ✅ Created lead ${leadId} for ${validated.nome} in campaign ${campaignId}`);
        }

        // ===== NEW FEATURES INTEGRATION =====
        
        // 1. Generate Personalization (async, non-blocking)
        if (leadId) {
          try {
            const { generatePersonalization, savePersonalization } = await import('@/lib/personalization-service');
            
            // Get enrichment data from the saved lead (it's stored in enrichment_data JSONB column)
            const { data: savedLead } = await supabaseAdmin
              .from('campaign_contacts')
              .select('enrichment_data')
              .eq('id', leadId)
              .single();
            
            const enrichmentData = savedLead?.enrichment_data || {};
            
            // Prepare personalization input from lead data
            // Use enrichmentData from database or fallback to validated fields
            const personalizationInput: any = {
              name: validated.nome,
              empresa: validated.empresa,
              industry: validated.industry || enrichmentData.industry,
              google_maps_ranking: enrichmentData.google_maps_ranking,
              rating: enrichmentData.rating,
              competitors: enrichmentData.competitors,
              website_performance: enrichmentData.website_performance,
              marketing_tags: validated.marketing_tags || enrichmentData.marketing_tags,
              pain_points: validated.pain_points || enrichmentData.pain_points,
              quality_score: validated.quality_score,
              fit_score: validated.fit_score,
              enrichment_score: validated.enrichment_score,
              niche: validated.niche || enrichmentData.niche,
              campaign_name: validated.campaign_name,
            };
            
            const personalization = await generatePersonalization(personalizationInput);
            await savePersonalization(leadId, personalization);
            
            console.log(`[Integration] Personalization generated for lead ${leadId}: ${personalization.personalizationScore}% score`);
          } catch (personalizationError) {
            console.error('[Integration] Personalization error:', personalizationError);
            // Continue even if personalization fails
          }
        }
        
        // 2. Calculate Optimal Send Time (async, non-blocking)
        if (leadId) {
          try {
            const { calculateOptimalSendTime, saveOptimalSendTime } = await import('@/lib/send-time-service');
            
            // Prepare send time input
            const sendTimeInput: any = {
              contactId: leadId,
              businessType: validated.industry?.toLowerCase().includes('health') ? 'healthcare' : 'general',
              niche: validated.niche,
              leadPriority: validated.quality_score && validated.quality_score >= 85 ? 'VIP' 
                          : validated.quality_score && validated.quality_score >= 70 ? 'HIGH'
                          : 'MEDIUM',
            };
            
            const sendTime = await calculateOptimalSendTime(sendTimeInput);
            await saveOptimalSendTime(sendTimeInput, sendTime);
            
            console.log(`[Integration] Optimal send time calculated for lead ${leadId}: ${sendTime.optimalSendAt}`);
          } catch (sendTimeError) {
            console.error('[Integration] Send time error:', sendTimeError);
            // Continue even if send time calculation fails
          }
        }
        
        // 3. Check for Active A/B Test (if campaign has one)
        if (leadId && campaignId) {
          try {
            const { getActiveTestForCampaign, assignVariant } = await import('@/lib/ab-testing-service');
            
            const activeTest = await getActiveTestForCampaign(campaignId);
            if (activeTest) {
              const assignment = await assignVariant(activeTest.testId, leadId);
              if (assignment.success) {
                console.log(`[Integration] Lead ${leadId} assigned to A/B test variant: ${assignment.variantName}`);
              }
            }
          } catch (abTestError) {
            console.error('[Integration] A/B test error:', abTestError);
            // Continue even if A/B test assignment fails
          }
        }
        
        // ===== END NEW FEATURES INTEGRATION =====

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
