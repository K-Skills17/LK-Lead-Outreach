/**
 * Lead Gen Tool Supabase Client
 *
 * This module initializes a Supabase client for direct access to the
 * Lead Gen Engine's database. This is separate from the Outreach Tool's
 * own Supabase database.
 *
 * Connection Details:
 * - Host: db.dktijniwjcmwyaliocen.supabase.co
 * - Database: postgres
 * - Port: 5432 (direct) or 6543 (pooler)
 *
 * Usage:
 * import { leadGenSupabase } from '@/lib/leadGenSupabase';
 * const { data, error } = await leadGenSupabase.from('leads').select();
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lead Gen Tool Supabase project details
const LEAD_GEN_SUPABASE_URL = 'https://dktijniwjcmwyaliocen.supabase.co';

let leadGenSupabaseInstance: SupabaseClient | null = null;

/**
 * Get Lead Gen Tool Supabase Client (lazy-loaded)
 *
 * Uses service-role key to bypass Row Level Security (RLS)
 * for full database access. Only use on server-side.
 */
function getLeadGenSupabase(): SupabaseClient {
  if (leadGenSupabaseInstance) {
    return leadGenSupabaseInstance;
  }

  const serviceRoleKey = process.env.LEAD_GEN_SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      'Missing Lead Gen Tool Supabase credentials. ' +
      'Please set LEAD_GEN_SUPABASE_SERVICE_ROLE_KEY environment variable.'
    );
  }

  leadGenSupabaseInstance = createClient(LEAD_GEN_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  });

  return leadGenSupabaseInstance;
}

/**
 * Lead Gen Tool Supabase Client
 *
 * Use this in your API routes and server-side code to access
 * the Lead Gen Engine's database directly.
 *
 * Available Tables:
 * - campaigns: Campaign management
 * - leads: Core lead data
 * - enrichment: Email/contact enrichment
 * - analysis: AI analysis and website scores
 * - reports: Generated PDF reports
 * - outreach: Email outreach tracking
 * - whatsapp_outreach: WhatsApp tracking
 * - lead_responses: Response tracking
 * - conversions: Conversion tracking
 * - competitor_analysis: Competitor data
 * - lead_quality_scores: Lead scoring
 * - send_time_analytics: Send time optimization
 * - calendar_bookings: Meeting bookings
 * - lead_outreach_sync: Sync status tracking
 * - audits: Clinic audit data
 * - analysis_landing_pages: Landing pages
 *
 * Available Views:
 * - campaign_stats: Campaign performance
 * - lead_engagement_scores: Lead engagement metrics
 * - channel_performance: Multi-channel attribution
 * - optimal_send_times: Send time optimization
 * - response_analytics: Response sentiment
 * - ab_test_performance: A/B test results
 * - lead_gen_sales_performance: Sales metrics
 */
export const leadGenSupabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getLeadGenSupabase();
    const value = client[prop as keyof SupabaseClient];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

/**
 * Check if Lead Gen database connection is configured
 */
export function isLeadGenDatabaseConfigured(): boolean {
  return !!process.env.LEAD_GEN_SUPABASE_SERVICE_ROLE_KEY;
}

/**
 * Test the Lead Gen database connection
 */
export async function testLeadGenConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    if (!isLeadGenDatabaseConfigured()) {
      return {
        success: false,
        message: 'Lead Gen database not configured. Missing LEAD_GEN_SUPABASE_SERVICE_ROLE_KEY.',
      };
    }

    // Try a simple query to test the connection
    const { data, error } = await leadGenSupabase
      .from('campaigns')
      .select('id')
      .limit(1);

    if (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        details: error,
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Lead Gen database.',
      details: { campaignsAccessible: true },
    };
  } catch (err) {
    return {
      success: false,
      message: `Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      details: err,
    };
  }
}

// ==========================================
// Type Definitions for Lead Gen Database
// ==========================================

export type LeadGenDatabase = {
  public: {
    Tables: {
      campaigns: {
        Row: LeadGenCampaign;
        Insert: Partial<LeadGenCampaign>;
        Update: Partial<LeadGenCampaign>;
      };
      leads: {
        Row: LeadGenLead;
        Insert: Partial<LeadGenLead>;
        Update: Partial<LeadGenLead>;
      };
      enrichment: {
        Row: LeadGenEnrichment;
        Insert: Partial<LeadGenEnrichment>;
        Update: Partial<LeadGenEnrichment>;
      };
      analysis: {
        Row: LeadGenAnalysis;
        Insert: Partial<LeadGenAnalysis>;
        Update: Partial<LeadGenAnalysis>;
      };
      reports: {
        Row: LeadGenReport;
        Insert: Partial<LeadGenReport>;
        Update: Partial<LeadGenReport>;
      };
      outreach: {
        Row: LeadGenOutreach;
        Insert: Partial<LeadGenOutreach>;
        Update: Partial<LeadGenOutreach>;
      };
      whatsapp_outreach: {
        Row: LeadGenWhatsAppOutreach;
        Insert: Partial<LeadGenWhatsAppOutreach>;
        Update: Partial<LeadGenWhatsAppOutreach>;
      };
      lead_responses: {
        Row: LeadGenResponse;
        Insert: Partial<LeadGenResponse>;
        Update: Partial<LeadGenResponse>;
      };
      conversions: {
        Row: LeadGenConversion;
        Insert: Partial<LeadGenConversion>;
        Update: Partial<LeadGenConversion>;
      };
      competitor_analysis: {
        Row: LeadGenCompetitorAnalysis;
        Insert: Partial<LeadGenCompetitorAnalysis>;
        Update: Partial<LeadGenCompetitorAnalysis>;
      };
      lead_quality_scores: {
        Row: LeadGenQualityScore;
        Insert: Partial<LeadGenQualityScore>;
        Update: Partial<LeadGenQualityScore>;
      };
      send_time_analytics: {
        Row: LeadGenSendTimeAnalytics;
        Insert: Partial<LeadGenSendTimeAnalytics>;
        Update: Partial<LeadGenSendTimeAnalytics>;
      };
      calendar_bookings: {
        Row: LeadGenCalendarBooking;
        Insert: Partial<LeadGenCalendarBooking>;
        Update: Partial<LeadGenCalendarBooking>;
      };
      lead_outreach_sync: {
        Row: LeadGenOutreachSync;
        Insert: Partial<LeadGenOutreachSync>;
        Update: Partial<LeadGenOutreachSync>;
      };
      audits: {
        Row: LeadGenAudit;
        Insert: Partial<LeadGenAudit>;
        Update: Partial<LeadGenAudit>;
      };
      analysis_landing_pages: {
        Row: LeadGenLandingPage;
        Insert: Partial<LeadGenLandingPage>;
        Update: Partial<LeadGenLandingPage>;
      };
      keyword_search_cache: {
        Row: LeadGenKeywordCache;
        Insert: Partial<LeadGenKeywordCache>;
        Update: Partial<LeadGenKeywordCache>;
      };
      lead_gen_sales_tracking: {
        Row: LeadGenSalesTracking;
        Insert: Partial<LeadGenSalesTracking>;
        Update: Partial<LeadGenSalesTracking>;
      };
    };
    Views: {
      campaign_stats: {
        Row: CampaignStatsView;
      };
      lead_engagement_scores: {
        Row: LeadEngagementScoreView;
      };
      channel_performance: {
        Row: ChannelPerformanceView;
      };
      optimal_send_times: {
        Row: OptimalSendTimesView;
      };
      response_analytics: {
        Row: ResponseAnalyticsView;
      };
      ab_test_performance: {
        Row: ABTestPerformanceView;
      };
      lead_gen_sales_performance: {
        Row: LeadGenSalesPerformanceView;
      };
    };
  };
};

// ==========================================
// Table Interfaces
// ==========================================

export interface LeadGenCampaign {
  id: string;
  name: string;
  keyword: string;
  location: string;
  niche?: string;
  country_code?: string;
  max_results?: number;
  status?: 'pending' | 'scraping' | 'processing' | 'completed' | 'failed';
  total_scraped?: number;
  total_enriched?: number;
  total_analyzed?: number;
  total_reported?: number;
  total_emailed?: number;
  campaign_type?: 'agency_outreach' | 'lead_gen_sales' | 'lead_generation';
  service_tier?: 'starter' | 'professional' | 'premium';
  offer_free_sample?: boolean;
  sample_size?: number;
  pricing_monthly?: number;
  target_agency_type?: string;
  filter_options?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface LeadGenLead {
  id: string;
  campaign_id?: string;
  business_name: string;
  full_address?: string;
  phone?: string;
  website?: string;
  domain?: string;
  rating?: number;
  reviews?: number;
  rank?: number;
  google_id?: string;
  country_code?: string;
  status?: 'new' | 'enriching' | 'enriched' | 'analyzing' | 'analyzed' | 'reported' | 'emailed' | 'failed' | 'skipped' | 'blacklisted';
  whatsapp_status?: string;
  source?: string;
  emails?: string[];
  best_email?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
}

export interface LeadGenEnrichment {
  id: string;
  lead_id: string;
  emails?: string[];
  best_email?: string;
  whatsapp_phone?: Record<string, any>;
  /** All phone numbers found (potential WhatsApp numbers) */
  all_phone_numbers?: string[];
  phone_numbers?: string[];
  contact_name?: string;
  found_on_page?: string;
  has_contact_page?: boolean;
  has_booking_system?: boolean;
  marketing_tags?: Record<string, any>;
  email_validation?: Record<string, any>;
  created_at?: string;
}

export interface LeadGenAnalysis {
  id: string;
  lead_id: string;
  pain_points?: Record<string, any>;
  competitor_analysis?: Record<string, any>;
  ai_email_intro?: string;
  ai_email_cta?: string;
  subject_line?: string;
  subject_line_score?: number;
  personalization_score?: number;
  send_time_scheduled?: string;
  send_time_reason?: string;
  generated_at?: string;
}

export interface LeadGenReport {
  id: string;
  lead_id: string;
  pdf_url?: string;
  drive_url?: string;
  mockup_url?: string;
  ai_analysis?: Record<string, any>;
  ai_email_intro?: string;
  ai_email_cta?: string;
  pain_points?: Record<string, any>;
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
  email_to: string;
  subject?: string;
  status?: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed';
  resend_message_id?: string;
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  replied_at?: string;
  open_count?: number;
  click_count?: number;
  conversion_channel?: string;
  scheduled_send_time?: string;
  actual_send_time?: string;
  intro_type?: string;
  personalization_level?: string;
  ab_test_id?: string;
  ab_variant_id?: string;
  error?: string;
  created_at?: string;
}

export interface LeadGenWhatsAppOutreach {
  id: string;
  lead_id: string;
  message_type: 'first_followup' | 'second_followup' | 'final' | 'custom';
  status?: 'pending' | 'sent' | 'failed' | 'delivered' | 'read';
  external_id?: string;
  content?: string;
  error?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  created_at?: string;
}

export interface LeadGenResponse {
  id: string;
  lead_id: string;
  campaign_id?: string;
  channel: 'email' | 'whatsapp';
  response_text?: string;
  sentiment_score?: number;
  sentiment_label?: 'hot' | 'warm' | 'cold' | 'negative';
  engagement_type?: 'reply' | 'click' | 'open' | 'bounce';
  responded_at?: string;
  created_at?: string;
}

export interface LeadGenConversion {
  id: string;
  lead_id: string;
  campaign_id?: string;
  conversion_channel: 'email' | 'whatsapp' | 'both';
  conversion_type: string;
  conversion_value?: number;
  converted_at?: string;
  created_at?: string;
}

export interface LeadGenCompetitorAnalysis {
  id: string;
  lead_id: string;
  campaign_id?: string;
  competitor_name: string;
  competitor_website?: string;
  competitor_rank?: number;
  competitor_rating?: number;
  competitor_reviews?: number;
  gap_analysis?: string;
  created_at?: string;
}

export interface LeadGenQualityScore {
  id: string;
  lead_id: string;
  quality_score: number;
  quality_tier?: 'VIP' | 'HOT' | 'WARM' | 'COLD';
  scoring_factors?: Record<string, any>;
  is_icp?: boolean;
  calculated_at?: string;
  created_at?: string;
}

export interface LeadGenSendTimeAnalytics {
  id: string;
  campaign_id?: string;
  lead_id?: string;
  niche?: string;
  sent_at: string;
  opened_at?: string;
  day_of_week?: number;
  hour_of_day?: number;
  time_to_open_minutes?: number;
  created_at?: string;
}

export interface LeadGenCalendarBooking {
  id: string;
  lead_id: string;
  campaign_id?: string;
  booking_url: string;
  booking_status?: 'pending' | 'booked' | 'completed' | 'cancelled';
  booked_at?: string;
  meeting_start?: string;
  meeting_end?: string;
  calendar_provider?: string;
  created_at?: string;
}

export interface LeadGenOutreachSync {
  id: string;
  lead_id: string;
  sent_at: string;
  sent_by?: string;
  sync_status?: 'success' | 'failed' | 'pending';
  response_data?: Record<string, any>;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeadGenAudit {
  id: string;
  lead_id?: string;
  clinic_name: string;
  clinic_location: string;
  website_url?: string;
  instagram_handle?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  /** Google rating (may be in audit_results or top-level) */
  rating?: number;
  /** Review count (may be in audit_results or top-level) */
  review_count?: number;
  /** GPB completeness score 0-100 (may be in audit_results or top-level) */
  gpb_completeness_score?: number;
  gpb_completeness_Score?: number;
  /** Full audit payload (JSONB); may contain rating, review_count, errors, etc. */
  audit_results?: Record<string, any>;
  created_at?: string;
  completed_at?: string;
}

export interface LeadGenLandingPage {
  id: string;
  lead_id: string;
  slug: string;
  title?: string;
  content_html?: string;
  page_views?: number;
  unique_visitors?: number;
  cta_clicks?: number;
  avg_time_on_page_seconds?: number;
  expires_at?: string;
  created_at?: string;
}

export interface LeadGenKeywordCache {
  id: string;
  keyword: string;
  location: string;
  monthly_searches?: number;
  competition?: string;
  trend?: string;
  cached_at?: string;
  expires_at?: string;
}

export interface LeadGenSalesTracking {
  id: string;
  campaign_id?: string;
  lead_id?: string;
  agency_name: string;
  agency_email: string;
  agency_phone?: string;
  sample_requested?: boolean;
  sample_delivered?: boolean;
  discovery_call_booked?: boolean;
  deal_closed?: boolean;
  deal_value_monthly?: number;
  service_tier?: string;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// View Interfaces
// ==========================================

export interface CampaignStatsView {
  id: string;
  name: string;
  niche?: string;
  status?: string;
  total_leads: number;
  emailed_count: number;
  enriched_count: number;
  opened_count: number;
  clicked_count: number;
  whatsapp_sent_count: number;
  whatsapp_delivered_count: number;
  whatsapp_read_count: number;
}

export interface LeadEngagementScoreView {
  lead_id: string;
  business_name: string;
  campaign_id?: string;
  niche?: string;
  quality_score?: number;
  email_opens: number;
  email_clicks: number;
  has_replied: boolean;
  has_whatsapp_response: boolean;
  sentiment_score?: number;
  engagement_level: 'hot' | 'warm' | 'cold' | 'neutral';
}

export interface ChannelPerformanceView {
  niche?: string;
  conversion_channel: 'email' | 'whatsapp' | 'both';
  conversion_count: number;
  reply_count: number;
  meeting_count: number;
  deal_count: number;
  avg_conversion_value?: number;
}

export interface OptimalSendTimesView {
  niche?: string;
  day_of_week: number;
  hour_of_day: number;
  send_count: number;
  open_count: number;
  open_rate_percent: number;
  avg_time_to_open_minutes?: number;
}

export interface ResponseAnalyticsView {
  niche?: string;
  channel: 'email' | 'whatsapp';
  total_responses: number;
  hot_responses: number;
  warm_responses: number;
  cold_responses: number;
  avg_sentiment_score?: number;
}

export interface ABTestPerformanceView {
  campaign_id?: string;
  variant_name: string;
  open_count: number;
  click_count: number;
}

export interface LeadGenSalesPerformanceView {
  campaign_id?: string;
  campaign_name?: string;
  target_agency_type?: string;
  total_prospects: number;
  samples_requested: number;
  samples_delivered: number;
  calls_booked: number;
  deals_closed: number;
  total_mrr?: number;
  sample_request_rate?: number;
  sample_to_close_rate?: number;
  avg_deal_value?: number;
}
