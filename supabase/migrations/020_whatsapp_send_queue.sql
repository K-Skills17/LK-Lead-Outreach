-- ============================================
-- WhatsApp Send Queue (for automatic delivery)
-- ============================================
-- Messages enqueued here are sent by the WhatsApp worker with
-- human-like delays and coffee/long breaks.

CREATE TABLE IF NOT EXISTS whatsapp_send_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_contact_id UUID NOT NULL REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  lead_phone TEXT NOT NULL,
  lead_name TEXT,
  lead_company TEXT,
  message_text TEXT NOT NULL,
  assigned_sdr_id UUID REFERENCES sdr_users(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_send_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  whatsapp_send_id UUID, -- set after worker sends (links to whatsapp_sends.id when that table exists)
  sent_by_system BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_send_queue_status ON whatsapp_send_queue(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_send_queue_created ON whatsapp_send_queue(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_send_queue_pending ON whatsapp_send_queue(created_at ASC) WHERE status = 'pending';

COMMENT ON TABLE whatsapp_send_queue IS 'Queue for automatic WhatsApp delivery; processed by the WhatsApp worker with human-like delays and breaks';
