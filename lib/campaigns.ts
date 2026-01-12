/**
 * Campaign Management Helper Functions
 * 
 * Provides utilities for campaign statistics and operations.
 */

import { supabaseAdmin } from './supabaseAdmin';

export interface CampaignStats {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  successRate: number; // percentage
}

/**
 * Get campaign statistics by status
 * 
 * @param campaignId - The campaign ID
 * @returns Campaign stats with counts by status
 */
export async function getCampaignStats(
  campaignId: string
): Promise<CampaignStats> {
  try {
    // Get all contacts for the campaign
    const { data: contacts, error } = await supabaseAdmin
      .from('campaign_contacts')
      .select('status')
      .eq('campaign_id', campaignId);

    if (error) {
      console.error('[CAMPAIGNS] Error fetching stats:', error);
      return {
        total: 0,
        pending: 0,
        sent: 0,
        failed: 0,
        successRate: 0,
      };
    }

    // Count by status
    const stats = contacts.reduce(
      (acc, contact) => {
        acc.total++;
        if (contact.status === 'pending') acc.pending++;
        if (contact.status === 'sent') acc.sent++;
        if (contact.status === 'failed') acc.failed++;
        return acc;
      },
      { total: 0, pending: 0, sent: 0, failed: 0 }
    );

    // Calculate success rate
    const completed = stats.sent + stats.failed;
    const successRate = completed > 0 ? (stats.sent / completed) * 100 : 0;

    return {
      ...stats,
      successRate: Math.round(successRate * 100) / 100, // Round to 2 decimals
    };
  } catch (error) {
    console.error('[CAMPAIGNS] Error calculating stats:', error);
    return {
      total: 0,
      pending: 0,
      sent: 0,
      failed: 0,
      successRate: 0,
    };
  }
}

/**
 * Check if a campaign belongs to a clinic
 * 
 * @param campaignId - The campaign ID
 * @param clinicId - The clinic ID
 * @returns True if campaign belongs to clinic
 */
export async function verifyCampaignOwnership(
  campaignId: string,
  clinicId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select('clinic_id')
      .eq('id', campaignId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.clinic_id === clinicId;
  } catch (error) {
    console.error('[CAMPAIGNS] Error verifying ownership:', error);
    return false;
  }
}

/**
 * Get campaign by ID with basic info
 * 
 * @param campaignId - The campaign ID
 * @returns Campaign data or null
 */
export async function getCampaign(campaignId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error) {
      console.error('[CAMPAIGNS] Error fetching campaign:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[CAMPAIGNS] Error:', error);
    return null;
  }
}

/**
 * Update campaign status
 * 
 * @param campaignId - The campaign ID
 * @param status - New status
 * @returns Success status
 */
export async function updateCampaignStatus(
  campaignId: string,
  status: 'draft' | 'active' | 'paused' | 'completed'
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('campaigns')
      .update({ status })
      .eq('id', campaignId);

    if (error) {
      console.error('[CAMPAIGNS] Error updating status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[CAMPAIGNS] Error:', error);
    return false;
  }
}

/**
 * Get all campaigns for a clinic
 * 
 * @param clinicId - The clinic ID
 * @param limit - Maximum number of campaigns to return
 * @returns Array of campaigns
 */
export async function getClinicCampaigns(
  clinicId: string,
  limit: number = 50
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[CAMPAIGNS] Error fetching campaigns:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[CAMPAIGNS] Error:', error);
    return [];
  }
}

/**
 * Check if a phone number is in the do-not-contact list
 * 
 * @param phone - Phone number in E.164 format
 * @returns True if phone is blocked
 */
export async function isPhoneBlocked(phone: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('do_not_contact')
      .select('phone')
      .eq('phone', phone)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not an error)
      console.error('[CAMPAIGNS] Error checking blocklist:', error);
    }

    return !!data;
  } catch (error) {
    console.error('[CAMPAIGNS] Error:', error);
    return false;
  }
}

/**
 * Check if a phone already exists in a campaign
 * 
 * @param campaignId - The campaign ID
 * @param phone - Phone number in E.164 format
 * @returns True if phone exists in campaign
 */
export async function isPhoneInCampaign(
  campaignId: string,
  phone: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('campaign_contacts')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('phone', phone)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[CAMPAIGNS] Error checking duplicate:', error);
    }

    return !!data;
  } catch (error) {
    console.error('[CAMPAIGNS] Error:', error);
    return false;
  }
}

/**
 * Get daily AI usage for a clinic
 * 
 * @param clinicId - The clinic ID
 * @param tier - The clinic tier
 * @returns Object with usage count and daily limit
 */
export async function getAIUsageToday(
  clinicId: string,
  tier: 'FREE' | 'PRO' | 'PREMIUM'
): Promise<{ count: number; limit: number }> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Get or create today's usage record
    const { data, error } = await supabaseAdmin
      .from('ai_usage_daily')
      .select('count, daily_limit')
      .eq('clinic_id', clinicId)
      .eq('usage_date', today)
      .single();

    if (error && error.code === 'PGRST116') {
      // No record for today, create one
      const dailyLimit = tier === 'FREE' ? 0 : tier === 'PRO' ? 10 : 50;
      
      const { data: newRecord } = await supabaseAdmin
        .from('ai_usage_daily')
        .insert({
          clinic_id: clinicId,
          usage_date: today,
          count: 0,
          tier,
          daily_limit: dailyLimit,
        })
        .select('count, daily_limit')
        .single();

      return {
        count: newRecord?.count || 0,
        limit: newRecord?.daily_limit || dailyLimit,
      };
    }

    if (error) {
      console.error('[CAMPAIGNS] Error fetching AI usage:', error);
      return { count: 0, limit: 0 };
    }

    return {
      count: data.count,
      limit: data.daily_limit,
    };
  } catch (error) {
    console.error('[CAMPAIGNS] Error:', error);
    return { count: 0, limit: 0 };
  }
}

/**
 * Increment AI usage counter for today
 * 
 * @param clinicId - The clinic ID
 * @returns Success status
 */
export async function incrementAIUsage(clinicId: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabaseAdmin.rpc('increment_ai_usage', {
      p_clinic_id: clinicId,
      p_date: today,
    });

    if (error) {
      // If RPC doesn't exist, do it manually
      const { data: current } = await supabaseAdmin
        .from('ai_usage_daily')
        .select('count')
        .eq('clinic_id', clinicId)
        .eq('usage_date', today)
        .single();

      if (current) {
        await supabaseAdmin
          .from('ai_usage_daily')
          .update({ count: current.count + 1 })
          .eq('clinic_id', clinicId)
          .eq('usage_date', today);
      }
    }

    return true;
  } catch (error) {
    console.error('[CAMPAIGNS] Error incrementing AI usage:', error);
    return false;
  }
}
