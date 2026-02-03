/**
 * Lead Gen Database Service
 * 
 * Queries the shared Supabase database tables from the Lead Gen Tool
 * to retrieve complete lead information when webhook/API transfer fails
 * or for convenience when displaying lead details.
 */

import { supabaseAdmin } from './supabaseAdmin';

export interface LeadGenLead {
  id: string;
  campaign_id?: string;
  business_name?: string;
  full_address?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
  website?: string;
  domain?: string;
  rating?: number;
  reviews?: number;
  rank?: number;
  google_id?: string;
  place_id?: string;
  country_code?: string;
  status?: string;
  whatsapp_status?: string;
  source?: string;
  emails?: string[];
  best_email?: string;
  business_quality_score?: number;
  business_quality_tier?: string;
  is_icp?: boolean;
  segment?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeadGenEnrichment {
  id: string;
  lead_id: string;
  emails?: string[];
  best_email?: string;
  whatsapp_phone?: any;
  contact_name?: string;
  found_on_page?: string;
  has_contact_page?: boolean;
  has_booking_system?: boolean;
  marketing_tags?: any;
  created_at?: string;
}

export interface LeadGenAnalysis {
  id: string;
  lead_id: string;
  speed_mobile?: number;
  speed_desktop?: number;
  performance_score?: number;
  accessibility_score?: number;
  seo_score?: number;
  best_practices_score?: number;
  page_score?: number; // Calculated or stored separately
  raw_data?: any;
  created_at?: string;
}

export interface LeadGenCompetitor {
  id: string;
  lead_id: string;
  competitor_name?: string;
  competitor_website?: string;
  competitor_rank?: number;
  competitor_rating?: number;
  competitor_reviews?: number;
  competitor_verified?: boolean;
  rank_difference?: number;
  rating_difference?: number;
  reviews_difference?: number;
  created_at?: string;
}

export interface LeadGenReport {
  id: string;
  lead_id: string;
  pdf_url?: string;
  drive_url?: string;
  mockup_url?: string;
  ai_analysis?: any;
  ai_email_intro?: string;
  ai_email_cta?: string;
  pain_points?: any;
  subject_line?: string;
  subject_line_score?: number;
  personalization_score?: number;
  send_time_scheduled?: string;
  send_time_reason?: string;
  generated_at?: string;
}

export interface LeadGenOutreach {
  id: string;
  lead_id: string;
  email_to?: string;
  subject?: string;
  status?: string;
  resend_message_id?: string;
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  replied_at?: string;
  open_count?: number;
  click_count?: number;
  conversion_channel?: string;
  created_at?: string;
}

export interface LeadGenWhatsAppOutreach {
  id: string;
  lead_id: string;
  message_type?: string;
  status?: string;
  external_id?: string;
  content?: string;
  error?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  created_at?: string;
}

export interface LeadGenLandingPage {
  id: string;
  lead_id: string;
  slug?: string;
  business_name?: string;
  headline?: string;
  pain_points?: any;
  competitor_data?: any;
  mockup_image_url?: string;
  analysis_image_url?: string;
  cta_text?: string;
  cta_url?: string;
  views?: number;
  unique_visitors?: number;
  cta_clicks?: number;
  avg_time_on_page?: number;
  template_variant?: string;
  meta_description?: string;
  created_at?: string;
  last_viewed_at?: string;
}

export interface CompleteLeadGenData {
  lead: LeadGenLead | null;
  campaign: any | null;
  enrichment: LeadGenEnrichment | null;
  analysis: LeadGenAnalysis | null;
  competitors: LeadGenCompetitor[];
  report: LeadGenReport | null;
  outreach: LeadGenOutreach[];
  whatsappOutreach: LeadGenWhatsAppOutreach[];
  landingPage: LeadGenLandingPage | null;
  qualityScore: any | null;
  syncStatus: any | null;
}

/**
 * Get complete lead data from Lead Gen Tool tables
 */
export async function getCompleteLeadGenData(leadId: string): Promise<CompleteLeadGenData | null> {
  try {
    // Get lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .maybeSingle();

    if (leadError) {
      console.error('[LeadGenDB] Error fetching lead:', leadError);
      return null;
    }

    if (!lead) {
      return null;
    }

    // Get campaign
    const campaignId = lead.campaign_id;
    let campaign = null;
    if (campaignId) {
      const { data: campData } = await supabaseAdmin
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .maybeSingle();
      campaign = campData;
    }

    // Get enrichment (1:1)
    const { data: enrichment } = await supabaseAdmin
      .from('enrichment')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();

    // Get analysis (1:1)
    const { data: analysis } = await supabaseAdmin
      .from('analysis')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();

    // Get competitors (1:many)
    const { data: competitors = [] } = await supabaseAdmin
      .from('competitors')
      .select('*')
      .eq('lead_id', leadId)
      .order('competitor_rank', { ascending: true });

    // Get report (1:1)
    const { data: report } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();

    // Get outreach history (1:many)
    const { data: outreach = [] } = await supabaseAdmin
      .from('outreach')
      .select('*')
      .eq('lead_id', leadId)
      .order('sent_at', { ascending: false });

    // Get WhatsApp outreach (1:many)
    const { data: whatsappOutreach = [] } = await supabaseAdmin
      .from('whatsapp_outreach')
      .select('*')
      .eq('lead_id', leadId)
      .order('sent_at', { ascending: false });

    // Get landing page (1:1)
    const { data: landingPage } = await supabaseAdmin
      .from('analysis_landing_pages')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();

    // Get quality score (1:1)
    const { data: qualityScore } = await supabaseAdmin
      .from('lead_quality_scores')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();

    // Get sync status (1:1)
    const { data: syncStatus } = await supabaseAdmin
      .from('lead_outreach_sync')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();

    return {
      lead: lead as LeadGenLead,
      campaign,
      enrichment: enrichment as LeadGenEnrichment | null,
      analysis: analysis as LeadGenAnalysis | null,
      competitors: (competitors || []) as LeadGenCompetitor[],
      report: report as LeadGenReport | null,
      outreach: (outreach || []) as LeadGenOutreach[],
      whatsappOutreach: (whatsappOutreach || []) as LeadGenWhatsAppOutreach[],
      landingPage: landingPage as LeadGenLandingPage | null,
      qualityScore,
      syncStatus,
    };
  } catch (error) {
    console.error('[LeadGenDB] Error getting complete lead data:', error);
    return null;
  }
}

/**
 * Get lead by phone number (for matching)
 */
export async function getLeadGenLeadByPhone(phone: string): Promise<LeadGenLead | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[LeadGenDB] Error fetching lead by phone:', error);
      return null;
    }

    return data as LeadGenLead | null;
  } catch (error) {
    console.error('[LeadGenDB] Error getting lead by phone:', error);
    return null;
  }
}

/**
 * Get lead by lead_gen_id (if stored in campaign_contacts)
 */
export async function getLeadGenLeadById(leadId: string): Promise<LeadGenLead | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .maybeSingle();

    if (error) {
      console.error('[LeadGenDB] Error fetching lead by ID:', error);
      return null;
    }

    return data as LeadGenLead | null;
  } catch (error) {
    console.error('[LeadGenDB] Error getting lead by ID:', error);
    return null;
  }
}

/**
 * Merge Lead Gen Tool data into campaign_contacts format
 */
export function mergeLeadGenDataIntoContact(
  contact: any,
  leadGenData: CompleteLeadGenData
): any {
  const merged = { ...contact };

  if (leadGenData.lead) {
    const lg = leadGenData.lead;
    
    // Basic info
    if (!merged.nome && lg.business_name) merged.nome = lg.business_name;
    if (!merged.empresa && lg.business_name) merged.empresa = lg.business_name;
    if (!merged.phone && lg.phone) merged.phone = lg.phone;
    if (!merged.site && lg.website) merged.site = lg.website;
    if (!merged.domain && lg.domain) merged.domain = lg.domain;
    
    // Location
    if (!merged.city && lg.city) merged.city = lg.city;
    if (!merged.state && lg.state) merged.state = lg.state;
    if (!merged.country && lg.country_code) merged.country = lg.country_code;
    if (!merged.location && lg.full_address) merged.location = lg.full_address;
    if (!merged.full_address && lg.full_address) merged.full_address = lg.full_address;
    if (!merged.postal_code && lg.postal_code) merged.postal_code = lg.postal_code;
    
    // Google data
    if (!merged.rating && lg.rating) merged.rating = lg.rating;
    if (!merged.reviews && lg.reviews) merged.reviews = lg.reviews;
    if (!merged.rank && lg.rank) merged.rank = lg.rank;
    if (!merged.google_id && lg.google_id) merged.google_id = lg.google_id;
    if (!merged.place_id && lg.place_id) merged.place_id = lg.place_id;
    
    // Quality scores
    if (!merged.business_quality_score && lg.business_quality_score) {
      merged.business_quality_score = lg.business_quality_score;
    }
    if (!merged.business_quality_tier && lg.business_quality_tier) {
      merged.business_quality_tier = lg.business_quality_tier;
    }
    if (!merged.is_icp && lg.is_icp !== undefined) merged.is_icp = lg.is_icp;
    if (!merged.segment && lg.segment) merged.segment = lg.segment;
    
    // Emails
    if (!merged.email && lg.best_email) merged.email = lg.best_email;
    if (!merged.all_emails && lg.emails && Array.isArray(lg.emails)) {
      merged.all_emails = lg.emails;
    }
  }

  if (leadGenData.enrichment) {
    const enr = leadGenData.enrichment;
    
    if (!merged.all_emails && enr.emails && Array.isArray(enr.emails)) {
      merged.all_emails = enr.emails;
    }
    if (!merged.email && enr.best_email) merged.email = enr.best_email;
    if (!merged.whatsapp_phone && enr.whatsapp_phone) {
      merged.whatsapp_phone = typeof enr.whatsapp_phone === 'string' 
        ? enr.whatsapp_phone 
        : enr.whatsapp_phone?.number;
    }
    if (!merged.contact_names && enr.contact_name) {
      merged.contact_names = [enr.contact_name];
    }
    if (enr.has_contact_page !== undefined) merged.has_contact_page = enr.has_contact_page;
    if (enr.has_booking_system !== undefined) merged.has_booking_system = enr.has_booking_system;
    if (enr.found_on_page) merged.found_on_page = enr.found_on_page;
  }

  if (leadGenData.analysis) {
    const an = leadGenData.analysis;
    
    if (!merged.seo_score && an.seo_score) merged.seo_score = an.seo_score;
    if (!merged.page_score && an.page_score) merged.page_score = an.page_score;
    if (!merged.page_score && an.performance_score) merged.page_score = an.performance_score;
    if (!merged.page_score && an.speed_desktop) merged.page_score = an.speed_desktop;
  }

  if (leadGenData.competitors && leadGenData.competitors.length > 0) {
    if (!merged.competitor_count) {
      merged.competitor_count = leadGenData.competitors.length;
    }
  }

  if (leadGenData.report) {
    const rep = leadGenData.report;
    
    if (!merged.report_url && rep.drive_url) merged.report_url = rep.drive_url;
    if (!merged.pdf_url && rep.pdf_url) merged.pdf_url = rep.pdf_url;
    if (!merged.drive_url && rep.drive_url) merged.drive_url = rep.drive_url;
    if (!merged.mockup_url && rep.mockup_url) merged.mockup_url = rep.mockup_url;
    if (!merged.personalized_message && rep.ai_email_intro) {
      merged.personalized_message = rep.ai_email_intro;
    }
    if (!merged.pain_points && rep.pain_points) {
      merged.pain_points = Array.isArray(rep.pain_points) 
        ? rep.pain_points 
        : typeof rep.pain_points === 'object' 
          ? Object.keys(rep.pain_points).filter(k => rep.pain_points[k])
          : [];
    }
    if (!merged.subject_line && rep.subject_line) merged.subject_line = rep.subject_line;
    if (!merged.personalization_score && rep.personalization_score) {
      merged.personalization_score = rep.personalization_score;
    }
  }

  if (leadGenData.landingPage) {
    const lp = leadGenData.landingPage;
    
    if (!merged.landing_page_url && lp.analysis_image_url) {
      merged.landing_page_url = lp.analysis_image_url;
    }
    if (!merged.analysis_image_url && lp.analysis_image_url) {
      merged.analysis_image_url = lp.analysis_image_url;
    }
    if (!merged.mockup_url && lp.mockup_image_url) {
      merged.mockup_url = lp.mockup_image_url;
    }
  }

  if (leadGenData.qualityScore) {
    const qs = leadGenData.qualityScore;
    
    if (!merged.business_quality_score && qs.quality_score) {
      merged.business_quality_score = qs.quality_score;
    }
    if (!merged.business_quality_tier && qs.quality_tier) {
      merged.business_quality_tier = qs.quality_tier;
    }
    if (!merged.is_icp && qs.is_icp !== undefined) merged.is_icp = qs.is_icp;
  }

  return merged;
}
