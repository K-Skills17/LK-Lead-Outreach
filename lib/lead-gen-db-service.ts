/**
 * Lead Gen Database Service
 *
 * Provides direct database access to the Lead Gen Engine's Supabase PostgreSQL
 * database for querying leads, campaigns, enrichment data, and analytics.
 *
 * This service bypasses API calls for maximum performance and flexibility.
 *
 * Benefits:
 * - Real-time data access
 * - No API rate limits
 * - Complex queries and joins
 * - Direct access to all historical data
 * - Better performance for bulk operations
 *
 * Usage:
 * import { getCompleteLeadGenData, getLeadsForCampaign } from '@/lib/lead-gen-db-service';
 */

// Import functions/values
import {
  leadGenSupabase,
  isLeadGenDatabaseConfigured,
  testLeadGenConnection,
} from './leadGenSupabase';

// Import types separately
import type {
  LeadGenCampaign,
  LeadGenLead,
  LeadGenEnrichment,
  LeadGenAnalysis,
  LeadGenReport,
  LeadGenOutreach,
  LeadGenWhatsAppOutreach,
  LeadGenResponse,
  LeadGenConversion,
  LeadGenCompetitorAnalysis,
  LeadGenQualityScore,
  LeadGenSendTimeAnalytics,
  LeadGenCalendarBooking,
  LeadGenOutreachSync,
  LeadGenLandingPage,
  CampaignStatsView,
  LeadEngagementScoreView,
  ChannelPerformanceView,
  OptimalSendTimesView,
  ResponseAnalyticsView,
  ABTestPerformanceView,
  LeadGenSalesPerformanceView,
} from './leadGenSupabase';

// Re-export functions
export {
  leadGenSupabase,
  isLeadGenDatabaseConfigured,
  testLeadGenConnection,
};

// Re-export types
export type {
  LeadGenCampaign,
  LeadGenLead,
  LeadGenEnrichment,
  LeadGenAnalysis,
  LeadGenReport,
  LeadGenOutreach,
  LeadGenWhatsAppOutreach,
  LeadGenResponse,
  LeadGenConversion,
  LeadGenCompetitorAnalysis,
  LeadGenQualityScore,
  LeadGenSendTimeAnalytics,
  LeadGenCalendarBooking,
  LeadGenOutreachSync,
  LeadGenLandingPage,
  CampaignStatsView,
  LeadEngagementScoreView,
  ChannelPerformanceView,
  OptimalSendTimesView,
  ResponseAnalyticsView,
  ABTestPerformanceView,
  LeadGenSalesPerformanceView,
};

// ==========================================
// Complete Lead Data Interface
// ==========================================

export interface CompleteLeadGenData {
  lead: LeadGenLead | null;
  campaign: LeadGenCampaign | null;
  enrichment: LeadGenEnrichment | null;
  analysis: LeadGenAnalysis | null;
  competitors: LeadGenCompetitorAnalysis[];
  report: LeadGenReport | null;
  outreach: LeadGenOutreach[];
  whatsappOutreach: LeadGenWhatsAppOutreach[];
  landingPage: LeadGenLandingPage | null;
  qualityScore: LeadGenQualityScore | null;
  syncStatus: LeadGenOutreachSync | null;
  responses: LeadGenResponse[];
  conversions: LeadGenConversion[];
  calendarBookings: LeadGenCalendarBooking[];
}

// ==========================================
// Core Data Retrieval Functions
// ==========================================

/**
 * Get complete lead data from Lead Gen Tool tables
 * Includes all related data: enrichment, analysis, reports, outreach history, etc.
 */
export async function getCompleteLeadGenData(leadId: string): Promise<CompleteLeadGenData | null> {
  try {
    if (!isLeadGenDatabaseConfigured()) {
      console.warn('[LeadGenDB] Database not configured');
      return null;
    }

    // Get lead
    const { data: lead, error: leadError } = await leadGenSupabase
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

    // Fetch all related data in parallel for better performance
    const [
      campaignResult,
      enrichmentResult,
      analysisResult,
      competitorsResult,
      reportResult,
      outreachResult,
      whatsappResult,
      landingPageResult,
      qualityScoreResult,
      syncStatusResult,
      responsesResult,
      conversionsResult,
      bookingsResult,
    ] = await Promise.all([
      // Campaign
      lead.campaign_id
        ? leadGenSupabase.from('campaigns').select('*').eq('id', lead.campaign_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      // Enrichment (1:1)
      leadGenSupabase.from('enrichment').select('*').eq('lead_id', leadId).maybeSingle(),
      // Analysis (1:1)
      leadGenSupabase.from('analysis').select('*').eq('lead_id', leadId).maybeSingle(),
      // Competitors (1:many)
      leadGenSupabase.from('competitor_analysis').select('*').eq('lead_id', leadId).order('competitor_rank', { ascending: true }),
      // Report (1:1)
      leadGenSupabase.from('reports').select('*').eq('lead_id', leadId).maybeSingle(),
      // Outreach history (1:many)
      leadGenSupabase.from('outreach').select('*').eq('lead_id', leadId).order('sent_at', { ascending: false }),
      // WhatsApp outreach (1:many)
      leadGenSupabase.from('whatsapp_outreach').select('*').eq('lead_id', leadId).order('sent_at', { ascending: false }),
      // Landing page (1:1)
      leadGenSupabase.from('analysis_landing_pages').select('*').eq('lead_id', leadId).maybeSingle(),
      // Quality score (1:1)
      leadGenSupabase.from('lead_quality_scores').select('*').eq('lead_id', leadId).maybeSingle(),
      // Sync status (1:1)
      leadGenSupabase.from('lead_outreach_sync').select('*').eq('lead_id', leadId).maybeSingle(),
      // Responses (1:many)
      leadGenSupabase.from('lead_responses').select('*').eq('lead_id', leadId).order('responded_at', { ascending: false }),
      // Conversions (1:many)
      leadGenSupabase.from('conversions').select('*').eq('lead_id', leadId).order('converted_at', { ascending: false }),
      // Calendar bookings (1:many)
      leadGenSupabase.from('calendar_bookings').select('*').eq('lead_id', leadId).order('booked_at', { ascending: false }),
    ]);

    return {
      lead: lead as LeadGenLead,
      campaign: (campaignResult.data as LeadGenCampaign) || null,
      enrichment: (enrichmentResult.data as LeadGenEnrichment) || null,
      analysis: (analysisResult.data as LeadGenAnalysis) || null,
      competitors: (competitorsResult.data || []) as LeadGenCompetitorAnalysis[],
      report: (reportResult.data as LeadGenReport) || null,
      outreach: (outreachResult.data || []) as LeadGenOutreach[],
      whatsappOutreach: (whatsappResult.data || []) as LeadGenWhatsAppOutreach[],
      landingPage: (landingPageResult.data as LeadGenLandingPage) || null,
      qualityScore: (qualityScoreResult.data as LeadGenQualityScore) || null,
      syncStatus: (syncStatusResult.data as LeadGenOutreachSync) || null,
      responses: (responsesResult.data || []) as LeadGenResponse[],
      conversions: (conversionsResult.data || []) as LeadGenConversion[],
      calendarBookings: (bookingsResult.data || []) as LeadGenCalendarBooking[],
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
    if (!isLeadGenDatabaseConfigured()) return null;

    const { data, error } = await leadGenSupabase
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
 * Get lead by ID
 */
export async function getLeadGenLeadById(leadId: string): Promise<LeadGenLead | null> {
  try {
    if (!isLeadGenDatabaseConfigured()) return null;

    const { data, error } = await leadGenSupabase
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

// ==========================================
// Campaign Data Functions
// ==========================================

/**
 * Get all leads for a campaign with enrichment and analysis data
 */
export async function getLeadsForCampaign(
  campaignId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: string;
    includeEnrichment?: boolean;
    includeAnalysis?: boolean;
    includeOutreach?: boolean;
  }
): Promise<{
  leads: (LeadGenLead & {
    enrichment?: LeadGenEnrichment | null;
    analysis?: LeadGenAnalysis | null;
    outreach?: LeadGenOutreach | null;
  })[];
  total: number;
}> {
  try {
    if (!isLeadGenDatabaseConfigured()) {
      return { leads: [], total: 0 };
    }

    const limit = options?.limit || 100;
    const offset = options?.offset || 0;

    // Build the select query
    let selectQuery = '*';
    if (options?.includeEnrichment) {
      selectQuery += ', enrichment(*)';
    }
    if (options?.includeAnalysis) {
      selectQuery += ', analysis(*)';
    }
    if (options?.includeOutreach) {
      selectQuery += ', outreach(*)';
    }

    let query = leadGenSupabase
      .from('leads')
      .select(selectQuery, { count: 'exact' })
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[LeadGenDB] Error fetching leads for campaign:', error);
      return { leads: [], total: 0 };
    }

    return {
      leads: (data || []) as unknown as (LeadGenLead & {
        enrichment?: LeadGenEnrichment | null;
        analysis?: LeadGenAnalysis | null;
        outreach?: LeadGenOutreach | null;
      })[],
      total: count || 0,
    };
  } catch (error) {
    console.error('[LeadGenDB] Error getting leads for campaign:', error);
    return { leads: [], total: 0 };
  }
}

/**
 * Get campaign by ID
 */
export async function getCampaign(campaignId: string): Promise<LeadGenCampaign | null> {
  try {
    if (!isLeadGenDatabaseConfigured()) return null;

    const { data, error } = await leadGenSupabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();

    if (error) {
      console.error('[LeadGenDB] Error fetching campaign:', error);
      return null;
    }

    return data as LeadGenCampaign | null;
  } catch (error) {
    console.error('[LeadGenDB] Error getting campaign:', error);
    return null;
  }
}

/**
 * Get all campaigns
 */
export async function getAllCampaigns(options?: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<LeadGenCampaign[]> {
  try {
    if (!isLeadGenDatabaseConfigured()) return [];

    let query = leadGenSupabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      const offset = options.offset || 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[LeadGenDB] Error fetching campaigns:', error);
      return [];
    }

    return (data || []) as LeadGenCampaign[];
  } catch (error) {
    console.error('[LeadGenDB] Error getting campaigns:', error);
    return [];
  }
}

// ==========================================
// Hot Leads & Quality Functions
// ==========================================

/**
 * Get hot leads (high engagement, high quality score)
 */
export async function getHotLeads(options?: {
  campaignId?: string;
  qualityTiers?: ('VIP' | 'HOT' | 'WARM')[];
  minSentimentScore?: number;
  minOpenCount?: number;
  limit?: number;
}): Promise<(LeadGenLead & {
  qualityScore: LeadGenQualityScore | null;
  response: LeadGenResponse | null;
  outreach: LeadGenOutreach | null;
})[]> {
  try {
    if (!isLeadGenDatabaseConfigured()) return [];

    const qualityTiers = options?.qualityTiers || ['VIP', 'HOT'];
    const limit = options?.limit || 50;

    // First get high quality leads
    const qualityQuery = leadGenSupabase
      .from('lead_quality_scores')
      .select('lead_id, quality_score, quality_tier, is_icp')
      .in('quality_tier', qualityTiers)
      .order('quality_score', { ascending: false })
      .limit(limit * 2); // Get more to filter

    const { data: qualityLeads, error: qualityError } = await qualityQuery;

    if (qualityError || !qualityLeads?.length) {
      return [];
    }

    const leadIds = qualityLeads.map((q) => q.lead_id);

    // Get lead details with related data
    let leadsQuery = leadGenSupabase
      .from('leads')
      .select('*')
      .in('id', leadIds);

    if (options?.campaignId) {
      leadsQuery = leadsQuery.eq('campaign_id', options.campaignId);
    }

    const { data: leads, error: leadsError } = await leadsQuery;

    if (leadsError || !leads?.length) {
      return [];
    }

    // Get responses and outreach data
    const [responsesResult, outreachResult] = await Promise.all([
      leadGenSupabase
        .from('lead_responses')
        .select('*')
        .in('lead_id', leadIds)
        .order('responded_at', { ascending: false }),
      leadGenSupabase
        .from('outreach')
        .select('*')
        .in('lead_id', leadIds)
        .order('sent_at', { ascending: false }),
    ]);

    // Create maps for quick lookup
    const qualityMap = new Map(qualityLeads.map((q) => [q.lead_id, q]));
    const responseMap = new Map<string, LeadGenResponse>();
    const outreachMap = new Map<string, LeadGenOutreach>();

    (responsesResult.data || []).forEach((r) => {
      if (!responseMap.has(r.lead_id)) {
        responseMap.set(r.lead_id, r as LeadGenResponse);
      }
    });

    (outreachResult.data || []).forEach((o) => {
      if (!outreachMap.has(o.lead_id)) {
        outreachMap.set(o.lead_id, o as LeadGenOutreach);
      }
    });

    // Combine and filter
    const results = leads
      .map((lead) => ({
        ...lead,
        qualityScore: qualityMap.get(lead.id) as LeadGenQualityScore || null,
        response: responseMap.get(lead.id) || null,
        outreach: outreachMap.get(lead.id) || null,
      }))
      .filter((lead) => {
        if (options?.minSentimentScore && lead.response) {
          if ((lead.response.sentiment_score || 0) < options.minSentimentScore) {
            return false;
          }
        }
        if (options?.minOpenCount && lead.outreach) {
          if ((lead.outreach.open_count || 0) < options.minOpenCount) {
            return false;
          }
        }
        return true;
      })
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error('[LeadGenDB] Error getting hot leads:', error);
    return [];
  }
}

/**
 * Get leads ready for outreach (enriched but not yet synced)
 */
export async function getLeadsReadyForOutreach(options?: {
  campaignId?: string;
  limit?: number;
}): Promise<(LeadGenLead & {
  enrichment: LeadGenEnrichment | null;
  analysis: LeadGenAnalysis | null;
  campaign: LeadGenCampaign | null;
})[]> {
  try {
    if (!isLeadGenDatabaseConfigured()) return [];

    const limit = options?.limit || 100;

    // Get leads that are enriched/analyzed and have email
    let query = leadGenSupabase
      .from('leads')
      .select(`
        *,
        enrichment(*),
        analysis(*),
        campaigns!leads_campaign_id_fkey(*)
      `)
      .in('status', ['enriched', 'analyzed'])
      .not('best_email', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (options?.campaignId) {
      query = query.eq('campaign_id', options.campaignId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[LeadGenDB] Error fetching leads ready for outreach:', error);
      return [];
    }

    // Filter out already synced leads
    const leadIds = (data || []).map((l: any) => l.id);

    if (leadIds.length === 0) return [];

    const { data: syncedLeads } = await leadGenSupabase
      .from('lead_outreach_sync')
      .select('lead_id')
      .in('lead_id', leadIds);

    const syncedSet = new Set((syncedLeads || []).map((s) => s.lead_id));

    return (data || [])
      .filter((l: any) => !syncedSet.has(l.id))
      .map((l: any) => ({
        ...l,
        enrichment: l.enrichment || null,
        analysis: l.analysis || null,
        campaign: l.campaigns || null,
      }));
  } catch (error) {
    console.error('[LeadGenDB] Error getting leads ready for outreach:', error);
    return [];
  }
}

// ==========================================
// Database Views Access Functions
// ==========================================

/**
 * Get campaign stats from the campaign_stats view
 */
export async function getCampaignStats(campaignId?: string): Promise<CampaignStatsView[]> {
  try {
    if (!isLeadGenDatabaseConfigured()) return [];

    let query = leadGenSupabase
      .from('campaign_stats')
      .select('*');

    if (campaignId) {
      query = query.eq('id', campaignId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[LeadGenDB] Error fetching campaign stats:', error);
      return [];
    }

    return (data || []) as CampaignStatsView[];
  } catch (error) {
    console.error('[LeadGenDB] Error getting campaign stats:', error);
    return [];
  }
}

/**
 * Get lead engagement scores from the lead_engagement_scores view
 */
export async function getLeadEngagementScores(options?: {
  campaignId?: string;
  engagementLevel?: 'hot' | 'warm' | 'cold' | 'neutral';
  limit?: number;
}): Promise<LeadEngagementScoreView[]> {
  try {
    if (!isLeadGenDatabaseConfigured()) return [];

    let query = leadGenSupabase
      .from('lead_engagement_scores')
      .select('*')
      .order('quality_score', { ascending: false });

    if (options?.campaignId) {
      query = query.eq('campaign_id', options.campaignId);
    }

    if (options?.engagementLevel) {
      query = query.eq('engagement_level', options.engagementLevel);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[LeadGenDB] Error fetching lead engagement scores:', error);
      return [];
    }

    return (data || []) as LeadEngagementScoreView[];
  } catch (error) {
    console.error('[LeadGenDB] Error getting lead engagement scores:', error);
    return [];
  }
}

/**
 * Get channel performance from the channel_performance view
 */
export async function getChannelPerformance(niche?: string): Promise<ChannelPerformanceView[]> {
  try {
    if (!isLeadGenDatabaseConfigured()) return [];

    let query = leadGenSupabase
      .from('channel_performance')
      .select('*');

    if (niche) {
      query = query.eq('niche', niche);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[LeadGenDB] Error fetching channel performance:', error);
      return [];
    }

    return (data || []) as ChannelPerformanceView[];
  } catch (error) {
    console.error('[LeadGenDB] Error getting channel performance:', error);
    return [];
  }
}

/**
 * Get optimal send times from the optimal_send_times view
 */
export async function getOptimalSendTimes(options?: {
  niche?: string;
  minSendCount?: number;
  limit?: number;
}): Promise<OptimalSendTimesView[]> {
  try {
    if (!isLeadGenDatabaseConfigured()) return [];

    let query = leadGenSupabase
      .from('optimal_send_times')
      .select('*')
      .order('open_rate_percent', { ascending: false });

    if (options?.niche) {
      query = query.eq('niche', options.niche);
    }

    if (options?.minSendCount) {
      query = query.gte('send_count', options.minSendCount);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[LeadGenDB] Error fetching optimal send times:', error);
      return [];
    }

    return (data || []) as OptimalSendTimesView[];
  } catch (error) {
    console.error('[LeadGenDB] Error getting optimal send times:', error);
    return [];
  }
}

/**
 * Get response analytics from the response_analytics view
 */
export async function getResponseAnalytics(options?: {
  niche?: string;
  channel?: 'email' | 'whatsapp';
}): Promise<ResponseAnalyticsView[]> {
  try {
    if (!isLeadGenDatabaseConfigured()) return [];

    let query = leadGenSupabase
      .from('response_analytics')
      .select('*');

    if (options?.niche) {
      query = query.eq('niche', options.niche);
    }

    if (options?.channel) {
      query = query.eq('channel', options.channel);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[LeadGenDB] Error fetching response analytics:', error);
      return [];
    }

    return (data || []) as ResponseAnalyticsView[];
  } catch (error) {
    console.error('[LeadGenDB] Error getting response analytics:', error);
    return [];
  }
}

/**
 * Get A/B test performance from the ab_test_performance view
 */
export async function getABTestPerformance(campaignId?: string): Promise<ABTestPerformanceView[]> {
  try {
    if (!isLeadGenDatabaseConfigured()) return [];

    let query = leadGenSupabase
      .from('ab_test_performance')
      .select('*');

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[LeadGenDB] Error fetching A/B test performance:', error);
      return [];
    }

    return (data || []) as ABTestPerformanceView[];
  } catch (error) {
    console.error('[LeadGenDB] Error getting A/B test performance:', error);
    return [];
  }
}

/**
 * Get lead gen sales performance from the lead_gen_sales_performance view
 */
export async function getLeadGenSalesPerformance(
  campaignId?: string
): Promise<LeadGenSalesPerformanceView[]> {
  try {
    if (!isLeadGenDatabaseConfigured()) return [];

    let query = leadGenSupabase
      .from('lead_gen_sales_performance')
      .select('*');

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[LeadGenDB] Error fetching lead gen sales performance:', error);
      return [];
    }

    return (data || []) as LeadGenSalesPerformanceView[];
  } catch (error) {
    console.error('[LeadGenDB] Error getting lead gen sales performance:', error);
    return [];
  }
}

// ==========================================
// Sync Status Functions
// ==========================================

/**
 * Mark lead as synced to outreach tool
 */
export async function markLeadAsSynced(
  leadId: string,
  options?: {
    sentBy?: string;
    responseData?: Record<string, any>;
  }
): Promise<boolean> {
  try {
    if (!isLeadGenDatabaseConfigured()) return false;

    const { error } = await leadGenSupabase
      .from('lead_outreach_sync')
      .upsert(
        {
          lead_id: leadId,
          sent_at: new Date().toISOString(),
          sync_status: 'success',
          sent_by: options?.sentBy || 'outreach-tool',
          response_data: options?.responseData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'lead_id',
        }
      );

    if (error) {
      console.error('[LeadGenDB] Error marking lead as synced:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[LeadGenDB] Error in markLeadAsSynced:', error);
    return false;
  }
}

/**
 * Get leads not yet synced to outreach tool
 */
export async function getUnsyncedLeads(options?: {
  campaignId?: string;
  limit?: number;
}): Promise<LeadGenLead[]> {
  try {
    if (!isLeadGenDatabaseConfigured()) return [];

    const limit = options?.limit || 100;

    // Get all synced lead IDs first
    const { data: syncedLeads } = await leadGenSupabase
      .from('lead_outreach_sync')
      .select('lead_id');

    const syncedIds = (syncedLeads || []).map((s) => s.lead_id);

    // Get leads not in the synced list
    let query = leadGenSupabase
      .from('leads')
      .select('*')
      .in('status', ['enriched', 'analyzed'])
      .not('best_email', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (options?.campaignId) {
      query = query.eq('campaign_id', options.campaignId);
    }

    // Note: Supabase doesn't support "not in" for arrays directly in .select()
    // We'll filter in memory
    const { data, error } = await query;

    if (error) {
      console.error('[LeadGenDB] Error fetching unsynced leads:', error);
      return [];
    }

    return (data || []).filter((l) => !syncedIds.includes(l.id)) as LeadGenLead[];
  } catch (error) {
    console.error('[LeadGenDB] Error getting unsynced leads:', error);
    return [];
  }
}

// ==========================================
// Response & Conversion Tracking
// ==========================================

/**
 * Get leads with responses
 */
export async function getLeadsWithResponses(options?: {
  campaignId?: string;
  channel?: 'email' | 'whatsapp';
  sentimentLabel?: 'hot' | 'warm' | 'cold' | 'negative';
  limit?: number;
}): Promise<(LeadGenLead & { response: LeadGenResponse })[]> {
  try {
    if (!isLeadGenDatabaseConfigured()) return [];

    const limit = options?.limit || 50;

    let query = leadGenSupabase
      .from('lead_responses')
      .select(`
        *,
        leads(*)
      `)
      .order('responded_at', { ascending: false })
      .limit(limit);

    if (options?.campaignId) {
      query = query.eq('campaign_id', options.campaignId);
    }

    if (options?.channel) {
      query = query.eq('channel', options.channel);
    }

    if (options?.sentimentLabel) {
      query = query.eq('sentiment_label', options.sentimentLabel);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[LeadGenDB] Error fetching leads with responses:', error);
      return [];
    }

    return (data || [])
      .filter((r: any) => r.leads)
      .map((r: any) => ({
        ...r.leads,
        response: {
          id: r.id,
          lead_id: r.lead_id,
          campaign_id: r.campaign_id,
          channel: r.channel,
          response_text: r.response_text,
          sentiment_score: r.sentiment_score,
          sentiment_label: r.sentiment_label,
          engagement_type: r.engagement_type,
          responded_at: r.responded_at,
          created_at: r.created_at,
        } as LeadGenResponse,
      }));
  } catch (error) {
    console.error('[LeadGenDB] Error getting leads with responses:', error);
    return [];
  }
}

/**
 * Get conversion funnel for a campaign
 */
export async function getConversionFunnel(campaignId: string): Promise<{
  total_leads: number;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  replied: number;
  meetings_booked: number;
  deals_closed: number;
}> {
  try {
    if (!isLeadGenDatabaseConfigured()) {
      return {
        total_leads: 0,
        emails_sent: 0,
        emails_opened: 0,
        emails_clicked: 0,
        replied: 0,
        meetings_booked: 0,
        deals_closed: 0,
      };
    }

    // Get counts in parallel
    const [
      leadsResult,
      outreachResult,
      responsesResult,
      conversionsResult,
    ] = await Promise.all([
      leadGenSupabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('campaign_id', campaignId),
      leadGenSupabase
        .from('outreach')
        .select('id, status, opened_at, clicked_at', { count: 'exact' })
        .eq('lead_id', campaignId), // This needs to be joined
      leadGenSupabase
        .from('lead_responses')
        .select('id, engagement_type')
        .eq('campaign_id', campaignId)
        .eq('engagement_type', 'reply'),
      leadGenSupabase
        .from('conversions')
        .select('id, conversion_type')
        .eq('campaign_id', campaignId),
    ]);

    const outreachData = outreachResult.data || [];
    const conversionsData = conversionsResult.data || [];

    return {
      total_leads: leadsResult.count || 0,
      emails_sent: outreachData.length,
      emails_opened: outreachData.filter((o: any) => o.opened_at).length,
      emails_clicked: outreachData.filter((o: any) => o.clicked_at).length,
      replied: responsesResult.data?.length || 0,
      meetings_booked: conversionsData.filter(
        (c: any) => c.conversion_type === 'meeting_booked'
      ).length,
      deals_closed: conversionsData.filter(
        (c: any) => c.conversion_type === 'deal_closed'
      ).length,
    };
  } catch (error) {
    console.error('[LeadGenDB] Error getting conversion funnel:', error);
    return {
      total_leads: 0,
      emails_sent: 0,
      emails_opened: 0,
      emails_clicked: 0,
      replied: 0,
      meetings_booked: 0,
      deals_closed: 0,
    };
  }
}

// ==========================================
// Recent Activity Functions
// ==========================================

/**
 * Get recent activity across all channels
 */
export async function getRecentActivity(options?: {
  hours?: number;
  limit?: number;
}): Promise<{
  type: 'email_sent' | 'whatsapp_sent' | 'response_received' | 'conversion';
  time: string;
  business_name?: string;
  details: Record<string, any>;
}[]> {
  try {
    if (!isLeadGenDatabaseConfigured()) return [];

    const hours = options?.hours || 24;
    const limit = options?.limit || 100;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    // Fetch recent activities in parallel
    const [emailResult, whatsappResult, responseResult] = await Promise.all([
      leadGenSupabase
        .from('outreach')
        .select('*, leads(business_name)')
        .gte('sent_at', since)
        .order('sent_at', { ascending: false })
        .limit(limit),
      leadGenSupabase
        .from('whatsapp_outreach')
        .select('*, leads(business_name)')
        .gte('sent_at', since)
        .order('sent_at', { ascending: false })
        .limit(limit),
      leadGenSupabase
        .from('lead_responses')
        .select('*, leads(business_name)')
        .gte('responded_at', since)
        .order('responded_at', { ascending: false })
        .limit(limit),
    ]);

    const activities: any[] = [];

    // Add email activities
    (emailResult.data || []).forEach((e: any) => {
      activities.push({
        type: 'email_sent',
        time: e.sent_at,
        business_name: e.leads?.business_name,
        details: {
          email_to: e.email_to,
          status: e.status,
          subject: e.subject,
        },
      });
    });

    // Add WhatsApp activities
    (whatsappResult.data || []).forEach((w: any) => {
      activities.push({
        type: 'whatsapp_sent',
        time: w.sent_at,
        business_name: w.leads?.business_name,
        details: {
          message_type: w.message_type,
          status: w.status,
        },
      });
    });

    // Add response activities
    (responseResult.data || []).forEach((r: any) => {
      activities.push({
        type: 'response_received',
        time: r.responded_at,
        business_name: r.leads?.business_name,
        details: {
          channel: r.channel,
          sentiment_label: r.sentiment_label,
          response_text: r.response_text?.substring(0, 100),
        },
      });
    });

    // Sort by time and limit
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('[LeadGenDB] Error getting recent activity:', error);
    return [];
  }
}

// ==========================================
// Merge Lead Gen Data Helper
// ==========================================

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

    // Google data
    if (!merged.rating && lg.rating) merged.rating = lg.rating;
    if (!merged.reviews && lg.reviews) merged.reviews = lg.reviews;
    if (!merged.rank && lg.rank) merged.rank = lg.rank;
    if (!merged.google_id && lg.google_id) merged.google_id = lg.google_id;

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
      merged.whatsapp_phone =
        typeof enr.whatsapp_phone === 'string'
          ? enr.whatsapp_phone
          : enr.whatsapp_phone?.number;
    }
    if (!merged.contact_names && enr.contact_name) {
      merged.contact_names = [enr.contact_name];
    }
    if (enr.has_contact_page !== undefined)
      merged.has_contact_page = enr.has_contact_page;
    if (enr.has_booking_system !== undefined)
      merged.has_booking_system = enr.has_booking_system;
    if (enr.found_on_page) merged.found_on_page = enr.found_on_page;
  }

  if (leadGenData.analysis) {
    const an = leadGenData.analysis;

    if (!merged.ai_email_intro && an.ai_email_intro)
      merged.ai_email_intro = an.ai_email_intro;
    if (!merged.ai_email_cta && an.ai_email_cta)
      merged.ai_email_cta = an.ai_email_cta;
    if (!merged.subject_line && an.subject_line)
      merged.subject_line = an.subject_line;
    if (!merged.personalization_score && an.personalization_score)
      merged.personalization_score = an.personalization_score;
    if (!merged.send_time_scheduled && an.send_time_scheduled)
      merged.send_time_scheduled = an.send_time_scheduled;
    if (!merged.pain_points && an.pain_points) {
      const painPoints = an.pain_points;
      merged.pain_points = Array.isArray(painPoints)
        ? painPoints
        : typeof painPoints === 'object' && painPoints !== null
        ? Object.keys(painPoints).filter((k) => painPoints[k as keyof typeof painPoints])
        : [];
    }
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
  }

  if (leadGenData.landingPage) {
    const lp = leadGenData.landingPage;

    if (!merged.analysis_image_url && lp.slug) {
      // Landing page URL could be constructed from slug
      merged.landing_page_slug = lp.slug;
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
