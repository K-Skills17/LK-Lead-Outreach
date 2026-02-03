/**
 * WhatsApp Sending Service
 * 
 * Handles automatic WhatsApp message sending with human behavior simulation
 */

import { supabaseAdmin } from './supabaseAdmin';
import {
  canContactLead,
  calculateDelay,
  shouldTakeBreak,
  isWithinWorkingHours,
  getTimeUntilWorkingHours,
  recordContact,
  getDailyMessageCount,
  DEFAULT_HUMAN_BEHAVIOR_SETTINGS,
  type HumanBehaviorSettings,
} from './human-behavior-service';
import { shouldSkipDay } from './send-time-service';

export interface WhatsAppSendResult {
  success: boolean;
  whatsappSendId?: string;
  contactId?: string;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

export interface WhatsAppSendOptions {
  contactId: string;
  sdrId?: string;
  messageText: string;
  settings?: HumanBehaviorSettings;
  skipChecks?: boolean; // For manual sends
  includeImages?: boolean; // Include analysis images and landing pages in message
}

/**
 * Send WhatsApp message automatically with human behavior logic
 */
export async function sendWhatsAppMessage(
  options: WhatsAppSendOptions
): Promise<WhatsAppSendResult> {
  try {
    const {
      contactId,
      sdrId,
      messageText,
      settings = DEFAULT_HUMAN_BEHAVIOR_SETTINGS,
      skipChecks = false,
      includeImages = true,
    } = options;

    // Get contact details (including image URLs)
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('id, nome, empresa, phone, email, assigned_sdr_id, campaign_id, status, personalized_message, analysis_image_url, landing_page_url, report_url')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return {
        success: false,
        error: 'Contact not found',
      };
    }

    if (!contact.phone) {
      return {
        success: false,
        error: 'Contact has no phone number',
      };
    }

    // Skip checks for manual sends (admin/SDR initiated)
    if (!skipChecks) {
      // FAILSAFE: Check system time/date
      const systemNow = new Date();
      const dayOfWeek = systemNow.getDay();

      // Check weekend
      if (shouldSkipDay(dayOfWeek)) {
        return {
          success: false,
          skipped: true,
          skipReason: 'Weekend - outreach only allowed Monday-Friday',
        };
      }

      // Check working hours
      if (!isWithinWorkingHours(settings, systemNow)) {
        const timeUntil = getTimeUntilWorkingHours(settings, systemNow);
        return {
          success: false,
          skipped: true,
          skipReason: `Outside working hours. Resumes in ${Math.round((timeUntil || 0) / 60)} minutes`,
        };
      }

      // Check contact frequency
      const contactCheck = await canContactLead(
        contact.phone,
        contact.email || undefined,
        settings.daysSinceLastContact
      );

      if (!contactCheck.canContact) {
        return {
          success: false,
          skipped: true,
          skipReason: `Contacted ${contactCheck.daysSinceContact?.toFixed(1)} days ago. Minimum ${settings.daysSinceLastContact} days required.`,
        };
      }

      // Check daily limit
      const dailyCount = await getDailyMessageCount(sdrId || contact.assigned_sdr_id || undefined);
      if (dailyCount >= settings.dailyLimit) {
        return {
          success: false,
          skipped: true,
          skipReason: `Daily limit reached (${dailyCount}/${settings.dailyLimit})`,
        };
      }
    }

    // Use personalized message if available, otherwise use provided message
    let finalMessage = contact.personalized_message || messageText;
    
    // Append image URLs to message if available and includeImages is true
    if (includeImages) {
      const imageLinks: string[] = [];
      if ((contact as any).analysis_image_url) {
        imageLinks.push(`📊 Análise Visual: ${(contact as any).analysis_image_url}`);
      }
      if ((contact as any).landing_page_url) {
        imageLinks.push(`🎨 Landing Page: ${(contact as any).landing_page_url}`);
      }
      if ((contact as any).report_url && !(contact as any).analysis_image_url && !(contact as any).landing_page_url) {
        imageLinks.push(`📄 Relatório: ${(contact as any).report_url}`);
      }
      
      if (imageLinks.length > 0) {
        finalMessage = `${finalMessage}\n\n${imageLinks.join('\n')}`;
      }
    }

    // Create WhatsApp send record
    const { data: whatsappSend, error: insertError } = await supabaseAdmin
      .from('whatsapp_sends')
      .insert({
        campaign_contact_id: contact.id,
        lead_phone: contact.phone,
        lead_name: contact.nome,
        lead_company: contact.empresa,
        assigned_sdr_id: sdrId || contact.assigned_sdr_id || null,
        message_text: finalMessage,
        personalized_message: contact.personalized_message || null,
        whatsapp_status: 'sent',
        sent_at: new Date().toISOString(),
        is_delivered: true, // Assume delivered if sent successfully
        sent_by_sdr_id: sdrId || contact.assigned_sdr_id || null,
        sent_by_system: !skipChecks, // True if automatic, false if manual
        campaign_id: contact.campaign_id || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[WhatsApp Send] Error creating send record:', insertError);
      return {
        success: false,
        error: 'Failed to create send record',
      };
    }

    // Update contact status to 'sent'
    await supabaseAdmin
      .from('campaign_contacts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', contactId);

    // Record in contact history
    await recordContact({
      contactId: contact.id,
      phone: contact.phone,
      email: contact.email || undefined,
      channel: 'whatsapp',
      campaignId: contact.campaign_id || undefined,
      sdrId: sdrId || contact.assigned_sdr_id || undefined,
      status: 'sent',
    });

    return {
      success: true,
      whatsappSendId: whatsappSend.id,
      contactId: contact.id,
    };
  } catch (error) {
    console.error('[WhatsApp Send] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get WhatsApp send history for a contact, SDR, or campaign
 */
export async function getWhatsAppSendHistory(params: {
  contactId?: string;
  sdrId?: string;
  campaignId?: string;
  limit?: number;
}) {
  const { contactId, sdrId, campaignId, limit = 50 } = params;

  let query = supabaseAdmin
    .from('whatsapp_sends')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (contactId) {
    query = query.eq('campaign_contact_id', contactId);
  }
  if (sdrId) {
    query = query.eq('assigned_sdr_id', sdrId);
  }
  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[WhatsApp Send] Error fetching history:', error);
    return [];
  }

  return data || [];
}

/**
 * Get WhatsApp send statistics
 */
export async function getWhatsAppSendStats(params: {
  sdrId?: string;
  campaignId?: string;
  date?: Date;
}) {
  const { sdrId, campaignId, date = new Date() } = params;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  let query = supabaseAdmin
    .from('whatsapp_sends')
    .select('id, whatsapp_status, is_delivered, is_read, is_failed', { count: 'exact' })
    .gte('sent_at', startOfDay.toISOString())
    .lte('sent_at', endOfDay.toISOString());

  if (sdrId) {
    query = query.eq('assigned_sdr_id', sdrId);
  }
  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[WhatsApp Send] Error fetching stats:', error);
    return {
      total: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
    };
  }

  const sent = data?.filter((s) => s.whatsapp_status === 'sent' || s.whatsapp_status === 'delivered').length || 0;
  const delivered = data?.filter((s) => s.is_delivered).length || 0;
  const read = data?.filter((s) => s.is_read).length || 0;
  const failed = data?.filter((s) => s.is_failed).length || 0;

  return {
    total: count || 0,
    sent,
    delivered,
    read,
    failed,
  };
}
