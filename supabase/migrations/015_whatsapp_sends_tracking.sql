-- ============================================
-- WhatsApp Sends Tracking
-- ============================================
-- Tracks WhatsApp messages sent to leads, similar to email_sends
-- Links WhatsApp sends to SDRs for visibility in their queue

-- WhatsApp sends tracking table
CREATE TABLE IF NOT EXISTS whatsapp_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Lead/Contact reference
  campaign_contact_id UUID REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  lead_phone TEXT NOT NULL,
  lead_name TEXT,
  lead_company TEXT,
  
  -- SDR assignment
  assigned_sdr_id UUID REFERENCES sdr_users(id) ON DELETE SET NULL,
  
  -- Message content
  message_text TEXT NOT NULL,
  personalized_message TEXT, -- The full personalized message sent
  
  -- WhatsApp metadata
  whatsapp_message_id TEXT, -- External WhatsApp message ID if available
  whatsapp_status TEXT DEFAULT 'sent' CHECK (whatsapp_status IN ('sent', 'delivered', 'read', 'failed', 'pending')),
  
  -- Tracking status
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Status flags
  is_delivered BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  is_failed BOOLEAN DEFAULT false,
  
  -- Human behavior tracking
  delay_seconds INTEGER, -- Actual delay used before sending
  was_break BOOLEAN DEFAULT false, -- Whether this was sent after a break
  break_type TEXT, -- 'coffee' (15 messages), 'long' (50 messages), null
  
  -- Sender info
  sent_by_sdr_id UUID REFERENCES sdr_users(id) ON DELETE SET NULL,
  sent_by_system BOOLEAN DEFAULT false, -- True if sent automatically by system
  
  -- Campaign context
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  
  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sends_contact ON whatsapp_sends(campaign_contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sends_phone ON whatsapp_sends(lead_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sends_sdr ON whatsapp_sends(assigned_sdr_id) WHERE assigned_sdr_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_sends_campaign ON whatsapp_sends(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_sends_sent_at ON whatsapp_sends(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sends_status ON whatsapp_sends(whatsapp_status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sends_system ON whatsapp_sends(sent_by_system) WHERE sent_by_system = true;

COMMENT ON TABLE whatsapp_sends IS 'Tracks all WhatsApp messages sent to leads, including automatic and manual sends';
COMMENT ON COLUMN whatsapp_sends.sent_by_system IS 'True if message was sent automatically by the system using human behavior logic';
COMMENT ON COLUMN whatsapp_sends.delay_seconds IS 'Actual delay in seconds used before sending (for human behavior simulation)';
COMMENT ON COLUMN whatsapp_sends.break_type IS 'Type of break before this send: coffee (every 15), long (every 50), or null';
