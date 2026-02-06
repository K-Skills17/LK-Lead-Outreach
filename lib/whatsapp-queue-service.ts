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
 * Normalize phone for WhatsApp Web: digits only, with country code (e.g. 5511999999999).
 * WhatsApp id format: 5511999999999@c.us
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) return digits;
  return phone.replace(/\D/g, '');
}

/**
 * Get WhatsApp chat id from phone (for whatsapp-web.js)
 */
export function phoneToChatId(phone: string): string {
  const normalized = normalizePhoneForWhatsApp(phone);
  return `${normalized}@c.us`;
}

/**
 * Enqueue a WhatsApp message for the worker to send.
 * Fetches contact, builds message (with optional image links), inserts into queue.
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
    } = options;

    const { data: contact, error: contactError } = await supabaseAdmin
      .from('campaign_contacts')
      .select(
        'id, nome, empresa, phone, assigned_sdr_id, campaign_id, personalized_message, analysis_image_url, landing_page_url, report_url'
      )
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found' };
    }

    if (!contact.phone) {
      return { success: false, error: 'Contact has no phone number' };
    }

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
        lead_phone: contact.phone,
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
