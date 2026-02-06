/**
 * WhatsApp Send Queue Service
 *
 * Enqueue messages for the WhatsApp worker to send with human-like delays and breaks.
 * The worker (scripts/whatsapp-worker.js) processes this queue.
 */

import { supabaseAdmin } from './supabaseAdmin';

export interface EnqueueWhatsAppOptions {
  contactId: string;
  sdrId?: string;
  messageText?: string;
  includeImages?: boolean;
  sentBySystem?: boolean;
  /** When set, use this number instead of resolving from contact (e.g. user picked from potential_whatsapp_numbers). */
  phoneOverride?: string;
}

export interface QueueItem {
  id: string;
  campaign_contact_id: string;
  lead_phone: string;
  lead_name: string | null;
  lead_company: string | null;
  message_text: string;
  assigned_sdr_id: string | null;
  campaign_id: string | null;
  status: string;
  created_at: string;
  sent_by_system: boolean;
}

/**
 * Default country code when number has no country code (e.g. Brazil).
 */
const DEFAULT_COUNTRY_CODE = '55';

/**
 * Normalize phone for WhatsApp Web: digits only, with country code (e.g. 5511999999999).
 * WhatsApp id format: 5511999999999@c.us
 * If number has 10–11 digits and no leading country code, prepends DEFAULT_COUNTRY_CODE (55).
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits.length) return phone;
  // Already has country code (e.g. 55 for Brazil, 1 for US) – assume 2–3 digit prefix
  if (digits.length >= 12) return digits;
  // 10–11 digits: likely local format (e.g. 11 99999-9999) – add Brazil code
  if (digits.length >= 10 && digits.length <= 11 && !digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    return DEFAULT_COUNTRY_CODE + digits;
  }
  return digits;
}

/**
 * Get WhatsApp chat id from phone (for whatsapp-web.js)
 */
export function phoneToChatId(phone: string): string {
  const normalized = normalizePhoneForWhatsApp(phone);
  return `${normalized}@c.us`;
}

/**
 * Resolve the best WhatsApp number from a contact (any number on file).
 */
function resolveLeadPhone(contact: {
  phone?: string | null;
  whatsapp_phone?: string | null;
  potential_whatsapp_numbers?: string[] | null;
}, phoneOverride?: string): string | null {
  if (phoneOverride && phoneOverride.trim()) return phoneOverride.trim();
  if (contact.phone && String(contact.phone).trim()) return String(contact.phone).trim();
  const wp = (contact as any).whatsapp_phone;
  if (wp != null) {
    const s = typeof wp === 'string' ? wp : (wp?.number ?? wp?.phone ?? '');
    if (String(s).trim()) return String(s).trim();
  }
  const arr = (contact as any).potential_whatsapp_numbers;
  if (Array.isArray(arr) && arr.length > 0) {
    const first = arr[0];
    if (first && String(first).trim()) return String(first).trim();
  }
  return null;
}

/**
 * Enqueue a WhatsApp message for the worker to send.
 * Fetches contact, builds message (with optional image links), inserts into queue.
 * Uses any number on file: phone, whatsapp_phone, or first of potential_whatsapp_numbers.
 */
export async function enqueueWhatsAppSend(
  options: EnqueueWhatsAppOptions
): Promise<{ success: boolean; queueId?: string; error?: string }> {
  try {
    const {
      contactId,
      sdrId,
      messageText = '',
      includeImages = true,
      sentBySystem = true,
      phoneOverride,
    } = options;

    const { data: contact, error: contactError } = await supabaseAdmin
      .from('campaign_contacts')
      .select(
        'id, nome, empresa, phone, whatsapp_phone, potential_whatsapp_numbers, lead_gen_id, assigned_sdr_id, campaign_id, personalized_message, analysis_image_url, landing_page_url, report_url'
      )
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      console.warn('[WhatsApp Queue] Contact not found:', contactId, contactError?.code ?? contactError?.message);
      return { success: false, error: 'Contact not found' };
    }

    let leadPhone = resolveLeadPhone(contact, phoneOverride);

    // Fallback: numbers may exist only in Lead Gen (enrichment), not synced to campaign_contacts
    if (!leadPhone) {
      const leadGenId = (contact as any).lead_gen_id || contact.id;
      try {
        const { getCompleteLeadGenData, isLeadGenDatabaseConfigured } = await import('./lead-gen-db-service');
        if (isLeadGenDatabaseConfigured()) {
          const lg = await getCompleteLeadGenData(leadGenId);
          if (lg) {
            const merged: { phone?: string; whatsapp_phone?: string; potential_whatsapp_numbers?: string[] } = {};
            if (lg.lead?.phone) merged.phone = lg.lead.phone;
            const enr = lg.enrichment;
            if (enr) {
              const wp = typeof enr.whatsapp_phone === 'string' ? enr.whatsapp_phone : (enr as any).whatsapp_phone?.number;
              if (wp) merged.whatsapp_phone = wp;
              const allPhones = [
                ...(Array.isArray((enr as any).all_phone_numbers) ? (enr as any).all_phone_numbers : []),
                ...(Array.isArray((enr as any).phone_numbers) ? (enr as any).phone_numbers : []),
                ...(wp ? [wp] : []),
              ].filter(Boolean);
              if (allPhones.length > 0) merged.potential_whatsapp_numbers = [...new Set(allPhones)];
            }
            leadPhone = resolveLeadPhone({ ...contact, ...merged }, phoneOverride);
          }
        }
      } catch (e) {
        console.warn('[WhatsApp Queue] Lead Gen fallback error:', e);
      }
    }

    if (!leadPhone) {
      console.warn('[WhatsApp Queue] No phone for contact:', contactId, { phone: contact.phone, whatsapp_phone: (contact as any).whatsapp_phone, potential: (contact as any).potential_whatsapp_numbers });
      return { success: false, error: 'Contact has no phone number (phone, whatsapp_phone, or potential_whatsapp_numbers)' };
    }

    const normalizedPhone = normalizePhoneForWhatsApp(leadPhone);

    let finalMessage = contact.personalized_message || messageText;
    if (includeImages) {
      const imageLinks: string[] = [];
      if ((contact as any).analysis_image_url) {
        imageLinks.push(`📊 Análise Visual: ${(contact as any).analysis_image_url}`);
      }
      if ((contact as any).landing_page_url) {
        imageLinks.push(`🎨 Landing Page: ${(contact as any).landing_page_url}`);
      }
      if (
        (contact as any).report_url &&
        !(contact as any).analysis_image_url &&
        !(contact as any).landing_page_url
      ) {
        imageLinks.push(`📄 Relatório: ${(contact as any).report_url}`);
      }
      if (imageLinks.length > 0) {
        finalMessage = `${finalMessage}\n\n${imageLinks.join('\n')}`;
      }
    }

    const { data: row, error } = await supabaseAdmin
      .from('whatsapp_send_queue')
      .insert({
        campaign_contact_id: contact.id,
        lead_phone: normalizedPhone,
        lead_name: contact.nome,
        lead_company: contact.empresa,
        message_text: finalMessage,
        assigned_sdr_id: sdrId ?? contact.assigned_sdr_id ?? null,
        campaign_id: contact.campaign_id ?? null,
        status: 'pending',
        sent_by_system: sentBySystem,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[WhatsApp Queue] Enqueue error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, queueId: row?.id };
  } catch (err) {
    console.error('[WhatsApp Queue] Error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Get next pending items from the queue (for the worker).
 */
export async function getNextPendingQueueItems(limit: number = 1): Promise<QueueItem[]> {
  const { data, error } = await supabaseAdmin
    .from('whatsapp_send_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[WhatsApp Queue] getNextPending error:', error);
    return [];
  }
  return (data || []) as QueueItem[];
}

/**
 * Mark a queue item as sending (worker picked it up).
 */
export async function markQueueSending(id: string): Promise<void> {
  await supabaseAdmin
    .from('whatsapp_send_queue')
    .update({ status: 'sending' })
    .eq('id', id);
}

/**
 * Mark a queue item as sent and create whatsapp_sends + update contact.
 */
export async function markQueueSent(
  queueId: string,
  queueItem: QueueItem
): Promise<{ whatsappSendId: string } | null> {
  const { data: sendRow, error: sendError } = await supabaseAdmin
    .from('whatsapp_sends')
    .insert({
      campaign_contact_id: queueItem.campaign_contact_id,
      lead_phone: queueItem.lead_phone,
      lead_name: queueItem.lead_name,
      lead_company: queueItem.lead_company,
      assigned_sdr_id: queueItem.assigned_sdr_id,
      message_text: queueItem.message_text,
      personalized_message: queueItem.message_text,
      whatsapp_status: 'sent',
      sent_at: new Date().toISOString(),
      is_delivered: true,
      sent_by_sdr_id: queueItem.assigned_sdr_id,
      sent_by_system: queueItem.sent_by_system ?? true,
      campaign_id: queueItem.campaign_id,
    })
    .select('id')
    .single();

  if (sendError || !sendRow) {
    console.error('[WhatsApp Queue] markQueueSent create send error:', sendError);
    return null;
  }

  await supabaseAdmin
    .from('whatsapp_send_queue')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      whatsapp_send_id: sendRow.id,
      error_message: null,
    })
    .eq('id', queueId);

  await supabaseAdmin
    .from('campaign_contacts')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      error_message: null,
    })
    .eq('id', queueItem.campaign_contact_id);

  const { recordContact } = await import('./human-behavior-service');
  await recordContact({
    contactId: queueItem.campaign_contact_id,
    phone: queueItem.lead_phone,
    channel: 'whatsapp',
    campaignId: queueItem.campaign_id ?? undefined,
    sdrId: queueItem.assigned_sdr_id ?? undefined,
    status: 'sent',
  });

  return { whatsappSendId: sendRow.id };
}

/**
 * Mark a queue item as failed.
 */
export async function markQueueFailed(queueId: string, errorMessage: string): Promise<void> {
  await supabaseAdmin
    .from('whatsapp_send_queue')
    .update({
      status: 'failed',
      error_message: errorMessage,
    })
    .eq('id', queueId);
}

/**
 * Get pending queue count (for UI).
 */
export async function getPendingQueueCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('whatsapp_send_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) return 0;
  return count ?? 0;
}
