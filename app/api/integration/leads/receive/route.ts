import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/email-service-simple';
import { normalizePhone } from '@/lib/phone';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Complete validation schema matching Lead Gen Engine v2.0+ specification
const enrichmentDataSchema = z.object({
  // Lead basic info
  lead: z.object({
    id: z.string().optional(),
    campaign_id: z.string().optional(),
    business_name: z.string().optional(),
    full_address: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country_code: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    website: z.string().url().optional().or(z.literal('')),
    domain: z.string().optional(),
    rating: z.number().optional(),
    reviews: z.number().optional(),
    verified: z.boolean().optional(),
    rank: z.number().optional(),
    google_id: z.string().optional(),
    place_id: z.string().optional(),
    type: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    logo_url: z.string().url().optional().or(z.literal('')),
    owner_title: z.string().optional(),
    status: z.string().optional(),
    source: z.string().optional(),
    emails: z.array(z.string().email()).optional(),
    best_email: z.string().email().optional().or(z.literal('')),
    whatsapp_status: z.string().optional(),
    whatsapp_sequence_step: z.number().nullable().optional(),
    business_quality_score: z.number().optional(),
    business_quality_tier: z.string().optional(),
    is_icp: z.boolean().optional(),
    segment: z.string().optional(),
    failure_reason: z.string().nullable().optional(),
    niche: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  }).optional(),
  
  // Enrichment data
  enrichment: z.object({
    id: z.string().optional(),
    lead_id: z.string().optional(),
    emails: z.array(z.string().email()).optional(),
    best_email: z.string().email().optional().or(z.literal('')),
    whatsapp_phone: z.object({
      number: z.string().optional(),
      verified: z.boolean().optional(),
      country_code: z.string().optional(),
    }).optional(),
    contact_name: z.string().optional(),
    found_on_page: z.string().optional(),
    has_contact_page: z.boolean().optional(),
    has_booking_system: z.boolean().optional(),
    marketing_tags: z.any().optional(), // Can be object or array
    created_at: z.string().optional(),
  }).optional(),
  
  // Analysis data
  analysis: z.object({
    id: z.string().optional(),
    lead_id: z.string().optional(),
    competitor_count: z.number().optional(),
    business_score: z.number().optional(),
    business_tier: z.string().optional(),
    pain_points: z.array(z.string()).optional(),
    opportunities: z.array(z.string()).optional(),
    seo_score: z.number().optional(),
    page_score: z.number().optional(),
    social_presence_score: z.number().optional(),
    online_reputation_score: z.number().optional(),
  }).optional(),
  
  // Competitors
  competitors: z.array(z.any()).optional(),
  
  // Competitor analysis
  competitor_analysis: z.array(z.any()).optional(),
  
  // Reports
  reports: z.object({
    id: z.string().optional(),
    lead_id: z.string().optional(),
    pdf_url: z.string().url().optional().or(z.literal('')),
    drive_url: z.string().url().optional().or(z.literal('')),
    mockup_url: z.string().url().optional().or(z.literal('')),
    ai_analysis: z.any().optional(),
    ai_email_intro: z.string().optional(),
    ai_email_cta: z.string().optional(),
    pain_points: z.array(z.string()).optional(),
    subject_line: z.string().optional(),
    subject_line_score: z.number().optional(),
    personalization_score: z.number().optional(),
    send_time_scheduled: z.string().optional(),
    send_time_reason: z.string().optional(),
    generated_at: z.string().optional(),
  }).optional(),
  
  // Landing page
  landing_page: z.object({
    id: z.string().optional(),
    lead_id: z.string().optional(),
    analysis_image_url: z.string().url().optional().or(z.literal('')),
    analysis_image_generation_id: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  }).optional(),
  
  // Outreach history
  outreach_history: z.object({
    email: z.array(z.any()).optional(),
    whatsapp: z.array(z.any()).optional(),
  }).optional(),
  
  // Responses
  responses: z.array(z.any()).optional(),
  
  // Conversions
  conversions: z.array(z.any()).optional(),
  
  // Send time analytics
  send_time_analytics: z.array(z.any()).optional(),
  
  // Calendar bookings
  calendar_bookings: z.array(z.any()).optional(),
  
  // Campaign context
  campaign: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    keyword: z.string().optional(),
    location: z.string().optional(),
    niche: z.string().optional(),
    country_code: z.string().optional(),
    max_results: z.number().optional(),
    status: z.string().optional(),
    total_scraped: z.number().optional(),
    total_enriched: z.number().optional(),
    total_analyzed: z.number().optional(),
    total_reported: z.number().optional(),
    total_emailed: z.number().optional(),
    campaign_type: z.string().optional(),
    service_tier: z.string().optional(),
    offer_free_sample: z.boolean().optional(),
    sample_size: z.number().optional(),
    pricing_monthly: z.number().optional(),
    target_agency_type: z.string().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  }).optional(),
  
  // Metadata
  metadata: z.object({
    exported_at: z.string().optional(),
    exported_by: z.string().optional(),
    version: z.string().optional(),
    includes_all_data: z.boolean().optional(),
  }).optional(),
}).passthrough(); // Allow additional fields

// Top-level validation schema
const enrichedLeadSchema = z.object({
  // Required fields
  nome: z.string().optional(), // Can fallback to empresa if not provided
  empresa: z.string().min(1, 'Empresa is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.union([z.string().email('Invalid email'), z.null(), z.literal('')]).optional(),
  
  // Location fields
  location: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  
  // Campaign context
  niche: z.string().optional(),
  campaign_name: z.string().optional(),
  
  // Complete enrichment data
  enrichment_data: enrichmentDataSchema.optional(),
  
  // Report URLs
  report_url: z.union([z.string().url(), z.null(), z.literal('')]).optional(),
  analysis_image_url: z.union([z.string().url(), z.null(), z.literal('')]).optional(),
  
  // Auto-assignment
  auto_assign_sdr: z.boolean().default(false).optional(),
  sdr_email: z.string().email().optional(),
  
  // Legacy fields (for backward compatibility)
  cargo: z.string().optional(),
  site: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  zip_code: z.string().optional(),
  dor_especifica: z.string().optional(),
  all_emails: z.array(z.string().email()).optional(),
  whatsapp: z.string().optional(),
  contact_names: z.array(z.string()).optional(),
  marketing_tags: z.union([z.array(z.string()), z.record(z.string(), z.boolean())]).optional(),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  revenue_range: z.string().optional(),
  pain_points: z.array(z.string()).optional(),
  business_analysis: z.string().optional(),
  competitor_analysis: z.string().optional(),
  enrichment_score: z.number().min(0).max(100).optional(),
  quality_score: z.number().min(0).max(100).optional(),
  fit_score: z.number().min(0).max(100).optional(),
  landing_page_url: z.union([z.string().url(), z.null(), z.literal('')]).optional(),
  personalization_data: z.any().optional(),
  outreach_history: z.object({
    emails_sent: z.array(z.any()).optional(),
    whatsapp_messages: z.array(z.any()).optional(),
  }).optional(),
  campaign_id: z.string().optional(),
  campaign_settings: z.any().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  lead_id: z.string().optional(),
  created_at: z.string().optional(),
  enriched_at: z.string().optional(),
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
      lead_ids: [] as string[], // Track lead IDs for response
    };

    console.log(`[Integration] Processing ${leads.length} lead(s)`);

    for (const leadData of leads) {
      try {
        console.log(`[Integration] Validating lead: ${leadData.nome || leadData.empresa || 'unknown'}`);
        // Validate lead data
        const validated = enrichedLeadSchema.parse(leadData);
        // Use nome or fallback to empresa
        const leadName = validated.nome || validated.empresa;
        console.log(`[Integration] ✅ Validation passed for ${leadName}`);

        // Normalize phone
        const normalizedPhone = normalizePhone(validated.phone);

        // Check if phone is blocked
        const { data: blocked, error: blockedError } = await supabaseAdmin
          .from('do_not_contact')
          .select('id')
          .eq('phone', normalizedPhone)
          .single();

        if (blockedError && blockedError.code !== 'PGRST116') {
          // PGRST116 = no rows returned (expected if not blocked)
          console.error('[Integration] Error checking blocked list:', blockedError);
        }

        if (blocked) {
          console.log(`[Integration] ⚠️ Phone ${validated.phone} is blocked - skipping`);
          results.errors.push(`Phone ${validated.phone} is blocked`);
          continue; // Skip blocked leads but don't fail the entire request
        }
        
        console.log(`[Integration] Phone ${normalizedPhone} is not blocked - proceeding`);

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

          // Extract keyword from campaign name or use a default
          // If campaign name contains a keyword (e.g., "Dentista RJ" -> "Dentista"), use it
          // Otherwise, use the campaign name as keyword
          const keyword = validated.niche || validated.campaign_name || campaignName.split(' ')[0] || 'general';
          
          // Extract location from lead data - REQUIRED field (NOT NULL constraint)
          // Priority: validated.location > validated.city > validated.state > validated.country > 'Unknown'
          const location = validated.location || 
                          validated.city || 
                          validated.state || 
                          validated.country || 
                          'Unknown'; // Always provide a value since location is NOT NULL

          // Build campaign insert object with all required fields
          // The database requires: clinic_id, name, location (and possibly keyword)
          // Always provide location and keyword to avoid NOT NULL violations
          const campaignInsert: {
            clinic_id: string;
            name: string;
            location: string;
            keyword: string;
          } = {
              clinic_id: clinicId,
              name: campaignName,
            location: location, // REQUIRED - NOT NULL constraint
            keyword: keyword, // Always provide keyword (may also be NOT NULL)
          };

          // Don't set status - let database use default 'draft'
          // This ensures we never violate the CHECK constraint

          const { data: newCampaign, error: campaignError } = await supabaseAdmin
            .from('campaigns')
            .insert(campaignInsert)
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

        // Extract lead_gen_id from enrichment_data for duplicate detection
        const leadGenId = validated.enrichment_data?.lead?.id || validated.lead_id || null;
        
        // Check if lead already exists (by lead_gen_id or phone)
        console.log(`[Integration] Checking for existing lead (lead_gen_id: ${leadGenId}, phone: ${normalizedPhone})`);
        let existingLead = null;
        
        if (leadGenId) {
          // First try to find by lead_gen_id (most reliable)
          const { data: existingByGenId } = await supabaseAdmin
            .from('campaign_contacts')
            .select('id')
            .eq('lead_gen_id', leadGenId)
            .limit(1)
            .single();
          
          if (existingByGenId) {
            existingLead = existingByGenId;
            console.log(`[Integration] Found existing lead by lead_gen_id: ${existingLead.id}`);
          }
        }
        
        // If not found by lead_gen_id, check by phone in this campaign
        if (!existingLead) {
          const { data: existingLeads, error: existingLeadError } = await supabaseAdmin
            .from('campaign_contacts')
            .select('id')
            .eq('campaign_id', campaignId)
            .eq('phone', normalizedPhone)
            .limit(1);
          
          if (existingLeadError && existingLeadError.code !== 'PGRST116') {
            console.error('[Integration] Error checking existing lead:', existingLeadError);
            results.errors.push(`Error checking existing lead: ${existingLeadError.message}`);
            continue;
          }
          
          existingLead = existingLeads && existingLeads.length > 0 ? existingLeads[0] : null;
        }
        
        if (existingLead) {
          console.log(`[Integration] Lead already exists: ${existingLead.id} - will update`);
        } else {
          console.log(`[Integration] Lead does not exist - will create new`);
        }

        // Calculate optimal send time using AI service (respects day-of-week, skips weekends)
        const { calculateOptimalSendTime } = await import('@/lib/send-time-service');
        
        // Determine lead priority from personalization tier if available
        let leadPriority: 'VIP' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
        if (validated.personalization_data?.tier) {
          const tier = validated.personalization_data.tier.toUpperCase();
          if (tier === 'VIP') leadPriority = 'VIP';
          else if (tier === 'HOT') leadPriority = 'HIGH';
          else if (tier === 'WARM') leadPriority = 'MEDIUM';
          else leadPriority = 'LOW';
        }
        
        // Calculate optimal send time (respects delay + day-of-week logic)
        const delayHours = validated.whatsapp_followup_delay_hours || 24;
        const baseTime = new Date();
        baseTime.setHours(baseTime.getHours() + delayHours);
        
        const sendTimeResult = await calculateOptimalSendTime({
          contactId: existingLead?.id || 'new',
          businessType: validated.industry as any || 'general',
          niche: validated.niche,
          leadPriority,
          timezone: 'America/Sao_Paulo',
        });
        
        // Use optimal send time, but ensure it's at least delayHours from now
        const optimalSendAt = new Date(sendTimeResult.optimalSendAt);
        const minSendAt = new Date();
        minSendAt.setHours(minSendAt.getHours() + delayHours);
        
        const scheduledSendAt = optimalSendAt > minSendAt ? optimalSendAt : minSendAt;

        // Extract enrichment_data (complete structure from Lead Gen Engine)
        const enrichmentData = validated.enrichment_data || {};
        const leadInfo = enrichmentData.lead || {};
        const enrichmentDataObj = enrichmentData.enrichment || {};
        const analysisData = enrichmentData.analysis || {};
        const reportsData = enrichmentData.reports || {};
        const landingPageData = enrichmentData.landing_page || {};
        
        // Extract quick-access fields from enrichment_data for database columns
        const businessQualityScore = leadInfo.business_quality_score || analysisData.business_score || validated.quality_score || null;
        const businessQualityTier = leadInfo.business_quality_tier || analysisData.business_tier || null;
        const isICP = leadInfo.is_icp || false;
        const segment = leadInfo.segment || null;
        
        // Extract location fields (priority: top-level > enrichment_data.lead)
        const finalLocation = validated.location || leadInfo.full_address || leadInfo.city || validated.city || null;
        const finalCity = validated.city || leadInfo.city || null;
        const finalState = validated.state || leadInfo.state || null;
        const finalCountry = validated.country || leadInfo.country_code || null;
        
        // Extract report URLs (priority: top-level > reports)
        const finalReportUrl = validated.report_url || reportsData.pdf_url || reportsData.drive_url || null;
        const finalAnalysisImageUrl = validated.analysis_image_url || landingPageData.analysis_image_url || validated.landing_page_url || null;
        
        // Extract business intelligence scores
        const seoScore = analysisData.seo_score || null;
        const pageScore = analysisData.page_score || null;
        const socialPresenceScore = analysisData.social_presence_score || null;
        const onlineReputationScore = analysisData.online_reputation_score || null;
        const competitorCount = analysisData.competitor_count || null;
        
        // Extract pain points and opportunities
        const painPoints = analysisData.pain_points || reportsData.pain_points || validated.pain_points || null;
        const opportunities = analysisData.opportunities || null;
        
        // Extract AI-generated content
        const aiEmailIntro = reportsData.ai_email_intro || null;
        const aiEmailCta = reportsData.ai_email_cta || null;
        const subjectLine = reportsData.subject_line || null;
        const subjectLineScore = reportsData.subject_line_score || null;
        const personalizationScore = reportsData.personalization_score || null;
        const sendTimeReason = reportsData.send_time_reason || null;
        
        // Extract Google Maps data
        const googleId = leadInfo.google_id || null;
        const placeId = leadInfo.place_id || null;
        const rating = leadInfo.rating || null;
        const reviews = leadInfo.reviews || null;
        const verified = leadInfo.verified || null;
        const rank = leadInfo.rank || null;
        
        // Extract website/domain data
        const domain = leadInfo.domain || null;
        const fullAddress = leadInfo.full_address || validated.address || null;
        const postalCode = leadInfo.postal_code || validated.zip_code || null;
        const latitude = leadInfo.latitude || null;
        const longitude = leadInfo.longitude || null;
        const logoUrl = leadInfo.logo_url || null;
        const ownerTitle = leadInfo.owner_title || validated.cargo || null;
        
        // Extract business type/category
        const businessType = leadInfo.type || validated.industry || null;
        const category = leadInfo.category || null;
        const description = leadInfo.description || null;
        
        // Extract enrichment metadata
        const allEmails = enrichmentDataObj.emails || leadInfo.emails || validated.all_emails || null;
        const whatsappPhone = enrichmentDataObj.whatsapp_phone?.number || validated.whatsapp || leadInfo.whatsapp_sequence_step ? normalizedPhone : null;
        const whatsappStatus = enrichmentDataObj.whatsapp_phone?.verified ? 'verified' : leadInfo.whatsapp_status || null;
        const contactNames = enrichmentDataObj.contact_name ? [enrichmentDataObj.contact_name] : validated.contact_names || null;
        const hasContactPage = enrichmentDataObj.has_contact_page || null;
        const hasBookingSystem = enrichmentDataObj.has_booking_system || null;
        const foundOnPage = enrichmentDataObj.found_on_page || null;
        
        // Extract marketing tags (can be object or array)
        let marketingTags: string[] | null = null;
        if (enrichmentDataObj.marketing_tags) {
          if (Array.isArray(enrichmentDataObj.marketing_tags)) {
            marketingTags = enrichmentDataObj.marketing_tags;
          } else if (typeof enrichmentDataObj.marketing_tags === 'object' && !Array.isArray(enrichmentDataObj.marketing_tags)) {
            marketingTags = Object.keys(enrichmentDataObj.marketing_tags).filter(k => (enrichmentDataObj.marketing_tags as Record<string, boolean>)[k]);
          }
        } else if (validated.marketing_tags) {
          if (Array.isArray(validated.marketing_tags)) {
            marketingTags = validated.marketing_tags;
          } else if (typeof validated.marketing_tags === 'object' && validated.marketing_tags !== null && !Array.isArray(validated.marketing_tags)) {
            marketingTags = Object.keys(validated.marketing_tags).filter(k => (validated.marketing_tags as Record<string, boolean>)[k]);
          }
        }
        
        // Extract report URLs separately
        const pdfUrl = reportsData.pdf_url || null;
        const driveUrl = reportsData.drive_url || null;
        const mockupUrl = reportsData.mockup_url || null;
        
        // Store complete enrichment_data as JSONB (preserve full structure)
        const completeEnrichmentData = validated.enrichment_data || {};

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

        // Prepare lead data with all extracted fields
        const leadToUpsert: any = {
          campaign_id: campaignId,
          name: validated.nome || validated.empresa, // Backward compatibility
          nome: validated.nome || leadInfo.business_name || validated.empresa,
          empresa: validated.empresa || leadInfo.business_name,
          cargo: ownerTitle || validated.cargo || null,
          site: leadInfo.website || validated.site || null,
          dor_especifica: validated.dor_especifica || null,
          phone: normalizedPhone,
          email: validated.email || leadInfo.best_email || enrichmentDataObj.best_email || null,
          status: 'pending' as const,
          personalized_message: description || validated.business_analysis || null,
          
          // Lead Gen Engine tracking
          lead_gen_id: leadGenId,
          synced_at: new Date().toISOString(),
          
          // Location fields
          location: finalLocation,
          city: finalCity,
          state: finalState,
          country: finalCountry,
          
          // Business quality fields
          business_quality_score: businessQualityScore,
          business_quality_tier: businessQualityTier,
          is_icp: isICP,
          segment: segment,
          
          // Business intelligence scores
          business_score: analysisData.business_score || null,
          business_tier: analysisData.business_tier || null,
          seo_score: seoScore,
          page_score: pageScore,
          social_presence_score: socialPresenceScore,
          online_reputation_score: onlineReputationScore,
          competitor_count: competitorCount,
          
          // Pain points and opportunities
          pain_points: painPoints && Array.isArray(painPoints) && painPoints.length > 0 ? painPoints : null,
          opportunities: opportunities && Array.isArray(opportunities) && opportunities.length > 0 ? opportunities : null,
          
          // Report URLs
          report_url: finalReportUrl,
          pdf_url: pdfUrl,
          drive_url: driveUrl,
          mockup_url: mockupUrl,
          analysis_image_url: finalAnalysisImageUrl,
          analysis_image_generation_id: landingPageData.analysis_image_generation_id || null,
          
          // AI-generated content
          ai_email_intro: aiEmailIntro,
          ai_email_cta: aiEmailCta,
          subject_line: subjectLine,
          subject_line_score: subjectLineScore,
          personalization_score: personalizationScore,
          send_time_reason: sendTimeReason,
          
          // Google Maps fields
          google_id: googleId,
          place_id: placeId,
          rating: rating,
          reviews: reviews,
          verified: verified,
          rank: rank,
          
          // Website/domain fields
          domain: domain,
          full_address: fullAddress,
          postal_code: postalCode,
          latitude: latitude,
          longitude: longitude,
          logo_url: logoUrl,
          owner_title: ownerTitle,
          
          // Business type/category
          business_type: businessType,
          category: category,
          description: description,
          
          // Enrichment metadata
          all_emails: allEmails && Array.isArray(allEmails) && allEmails.length > 0 ? allEmails : null,
          whatsapp_phone: whatsappPhone,
          whatsapp_status: whatsappStatus,
          contact_names: contactNames && Array.isArray(contactNames) && contactNames.length > 0 ? contactNames : null,
          has_contact_page: hasContactPage,
          has_booking_system: hasBookingSystem,
          found_on_page: foundOnPage,
          
          // Legacy fields (for backward compatibility)
          industry: businessType || validated.industry || null,
          company_size: validated.company_size || null,
          revenue_range: validated.revenue_range || null,
          enrichment_score: validated.enrichment_score || null,
          source: validated.source || leadInfo.source || null,
          tags: validated.tags && Array.isArray(validated.tags) && validated.tags.length > 0 ? validated.tags : null,
          
          // Store complete enrichment_data as JSONB
          enrichment_data: Object.keys(completeEnrichmentData).length > 0 ? completeEnrichmentData : null,
          
          // Scheduling
          scheduled_send_at: scheduledSendAt.toISOString(),
          assigned_sdr_id: assignedSdrId || null,
        };
        
        console.log(`[Integration] Preparing to insert/update lead for ${leadName}`);
        console.log(`[Integration] Campaign ID: ${campaignId}`);
        console.log(`[Integration] Phone: ${normalizedPhone}`);

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
          results.lead_ids.push(leadId);
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
            results.errors.push(`Failed to create lead for ${leadName} - no ID returned`);
            continue;
          }
          
          results.created++;
          console.log(`[Integration] ✅ Created lead ${leadId} for ${leadName} in campaign ${campaignId}`);
          results.lead_ids.push(leadId);
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
        console.error('[Integration] ❌ Error processing lead:', error);
        if (error instanceof z.ZodError) {
          console.error('[Integration] Validation errors:', error.issues);
        }
      }
    }
    
    console.log(`[Integration] 📊 Final results:`, {
      processed: results.processed,
      created: results.created,
      updated: results.updated,
      errors: results.errors.length,
      errorDetails: results.errors
    });

    // Return response matching Lead Gen Engine specification
    if (results.errors.length > 0 && results.processed === 0) {
      // All leads failed
      return NextResponse.json({
        success: false,
        error: results.errors.join('; '),
        code: 'PROCESSING_ERROR',
        processed: results.processed,
        created: results.created,
        updated: results.updated,
        errors: results.errors,
      }, { status: 400 });
    }
    
    // Success response
    const response: any = {
      success: true,
      message: `Processed ${results.processed} leads successfully`,
      processed: results.processed,
      created: results.created,
      updated: results.updated,
      emails_sent: results.emails_sent,
    };
    
    // For single lead, include lead_id
    if (leads.length === 1 && results.lead_ids.length > 0) {
      response.lead_id = results.lead_ids[0];
    }
    
    // Include errors if any (partial success)
    if (results.errors.length > 0) {
      response.errors = results.errors;
    }
    
    return NextResponse.json(response);
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
