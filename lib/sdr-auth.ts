/**
 * SDR Authentication Module
 * 
 * Handles SDR user authentication, password hashing, and session management
 */

import { supabaseAdmin } from './supabaseAdmin';
import { getCompleteLeadGenData, mergeLeadGenDataIntoContact } from './lead-gen-db-service';
import { hashPassword, verifyPassword } from './auth';

export interface SDRUser {
  id: string;
  email: string;
  name: string;
  role: 'sdr' | 'manager' | 'admin';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface SDRLoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  error?: string;
}

/**
 * Get SDR user by email
 */
export async function getSDRByEmail(email: string): Promise<SDRUser | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('sdr_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data as SDRUser;
  } catch (error) {
    console.error('[SDR Auth] Error getting SDR:', error);
    return null;
  }
}

/**
 * Get SDR user by ID
 */
export async function getSDRById(id: string): Promise<SDRUser | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('sdr_users')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data as SDRUser;
  } catch (error) {
    console.error('[SDR Auth] Error getting SDR by ID:', error);
    return null;
  }
}

/**
 * Verify SDR password
 */
export async function verifySDRPassword(
  email: string,
  password: string
): Promise<SDRUser | null> {
  const sdr = await getSDRByEmail(email);

  if (!sdr) {
    return null;
  }

  // Get password hash from database
  const { data } = await supabaseAdmin
    .from('sdr_users')
    .select('password_hash')
    .eq('id', sdr.id)
    .single();

  if (!data?.password_hash) {
    return null;
  }

  const isValid = await verifyPassword(password, data.password_hash);

  if (!isValid) {
    return null;
  }

  // Update last login
  await supabaseAdmin
    .from('sdr_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', sdr.id);

  return sdr;
}

/**
 * Create new SDR user
 */
export async function createSDRUser(data: {
  email: string;
  password: string;
  name: string;
  role?: 'sdr' | 'manager' | 'admin';
}): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Check if email already exists
    const existing = await getSDRByEmail(data.email);
    if (existing) {
      return {
        success: false,
        error: 'Email already registered',
      };
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const { data: newUser, error } = await supabaseAdmin
      .from('sdr_users')
      .insert({
        email: data.email.toLowerCase().trim(),
        password_hash: passwordHash,
        name: data.name,
        role: data.role || 'sdr',
        is_active: true,
      })
      .select('id')
      .single();

    if (error || !newUser) {
      console.error('[SDR Auth] Error creating user:', error);
      return {
        success: false,
        error: 'Failed to create user',
      };
    }

    return {
      success: true,
      userId: newUser.id,
    };
  } catch (error) {
    console.error('[SDR Auth] Error creating SDR:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get SDR's assigned campaigns
 */
export async function getSDRCampaigns(sdrId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('assigned_sdr_id', sdrId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SDR] Error getting campaigns:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[SDR] Error:', error);
    return [];
  }
}

/**
 * Get SDR's assigned leads
 */
export async function getSDRLeads(sdrId: string, status?: string) {
  try {
    let query = supabaseAdmin
      .from('campaign_contacts')
      .select(`
        *,
        campaigns (
          id,
          name
        )
      `)
      .eq('assigned_sdr_id', sdrId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SDR] Error getting leads:', error);
      return [];
    }

    const leads = data || [];
    
    // Fetch last email sent time for each lead
    if (leads.length > 0) {
      const leadIds = leads.map((l: any) => l.id);
      const { data: emailSends } = await supabaseAdmin
        .from('email_sends')
        .select('campaign_contact_id, sent_at')
        .in('campaign_contact_id', leadIds)
        .order('sent_at', { ascending: false });

      const emailSentTimes: Record<string, string> = {};
      if (emailSends) {
        emailSends.forEach((email: any) => {
          if (!emailSentTimes[email.campaign_contact_id] || 
              new Date(email.sent_at) > new Date(emailSentTimes[email.campaign_contact_id])) {
            emailSentTimes[email.campaign_contact_id] = email.sent_at;
          }
        });
      }

      // Add email sent time to each lead
      let enrichedLeads = leads.map((lead: any) => ({
        ...lead,
        lastEmailSentAt: emailSentTimes[lead.id] || null,
      }));

      // Enrich with Lead Gen Tool data for leads that have lead_gen_id or missing data
      const leadsToEnrich = enrichedLeads.filter((lead: any) => {
        const hasLeadGenId = lead.lead_gen_id;
        const hasMissingData = !lead.email || !lead.site || !lead.personalized_message || 
          (!lead.seo_score && !lead.page_score);
        return hasLeadGenId || hasMissingData;
      });

      if (leadsToEnrich.length > 0) {
        // Process in parallel but limit concurrency
        const enrichmentPromises = leadsToEnrich.slice(0, 50).map(async (lead: any) => {
          try {
            const leadGenId = lead.lead_gen_id || lead.id;
            const leadGenData = await getCompleteLeadGenData(leadGenId);
            
            if (leadGenData && leadGenData.lead) {
              return mergeLeadGenDataIntoContact(lead, leadGenData);
            }
            return lead;
          } catch (error) {
            console.error(`[SDR] Error enriching lead ${lead.id}:`, error);
            return lead;
          }
        });

        const enrichedResults = await Promise.all(enrichmentPromises);
        
        // Update the enriched leads array
        enrichedLeads = enrichedLeads.map((lead: any) => {
          const enriched = enrichedResults.find((e: any) => e.id === lead.id);
          return enriched || lead;
        });
      }

      return enrichedLeads;
    }

    return leads;
  } catch (error) {
    console.error('[SDR] Error:', error);
    return [];
  }
}

/**
 * Get SDR's unread replies
 */
export async function getSDRUnreadReplies(sdrId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('message_replies')
      .select(`
        *,
        campaign_contacts (
          id,
          nome,
          empresa,
          phone,
          campaigns (
            id,
            name
          )
        )
      `)
      .eq('sdr_id', sdrId)
      .eq('is_read', false)
      .order('received_at', { ascending: false });

    if (error) {
      console.error('[SDR] Error getting replies:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[SDR] Error:', error);
    return [];
  }
}
