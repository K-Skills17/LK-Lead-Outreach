-- ============================================
-- Email Tracking System
-- ============================================
-- Tracks emails sent to leads, including opens, clicks, and bounces
-- Links emails to SDRs for visibility in their queue

-- Email tracking table
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Lead/Contact reference
  campaign_contact_id UUID REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  lead_email TEXT NOT NULL,
  lead_name TEXT,
  lead_company TEXT,
  
  -- SDR assignment
  assigned_sdr_id UUID REFERENCES sdr_users(id) ON DELETE SET NULL,
  
  -- Email content
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  
  -- Email metadata
  from_email TEXT NOT NULL,
  reply_to TEXT,
  resend_email_id TEXT, -- Resend API email ID for tracking
  
  -- Tracking status
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  complaint_at TIMESTAMPTZ, -- Spam complaint
  
  -- Open tracking
  open_count INTEGER DEFAULT 0,
  last_opened_at TIMESTAMPTZ,
  first_opened_at TIMESTAMPTZ,
  
  -- Click tracking
  click_count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  first_clicked_at TIMESTAMPTZ,
  clicked_urls JSONB DEFAULT '[]'::jsonb, -- Array of clicked URLs
  
  -- Status flags
  is_delivered BOOLEAN DEFAULT false,
  is_opened BOOLEAN DEFAULT false,
  is_clicked BOOLEAN DEFAULT false,
  is_bounced BOOLEAN DEFAULT false,
  is_complained BOOLEAN DEFAULT false,
  
  -- Sender info
  sent_by_admin_id UUID, -- Admin who sent the email
  sent_by_admin_email TEXT,
  
  -- Campaign context
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_sends_contact ON email_sends(campaign_contact_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_sdr ON email_sends(assigned_sdr_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_lead_email ON email_sends(lead_email);
CREATE INDEX IF NOT EXISTS idx_email_sends_sent_at ON email_sends(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON email_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_resend_id ON email_sends(resend_email_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(is_opened, is_clicked, is_bounced);

-- Email events table (detailed event log)
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_send_id UUID NOT NULL REFERENCES email_sends(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
  event_data JSONB DEFAULT '{}'::jsonb, -- Additional event metadata
  
  -- Click tracking
  clicked_url TEXT, -- For click events
  
  -- User agent and IP (for opens/clicks)
  user_agent TEXT,
  ip_address TEXT,
  location_data JSONB, -- Country, city, etc.
  
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_events_send ON email_events(email_send_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_occurred ON email_events(occurred_at DESC);

-- Enable RLS
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role full access email_sends" ON email_sends FOR ALL USING (true);
CREATE POLICY "Service role full access email_events" ON email_events FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_sends_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_email_sends_updated_at ON email_sends;
CREATE TRIGGER update_email_sends_updated_at
  BEFORE UPDATE ON email_sends
  FOR EACH ROW
  EXECUTE FUNCTION update_email_sends_updated_at();

-- Comments
COMMENT ON TABLE email_sends IS 'Tracks all emails sent to leads, including delivery and engagement metrics';
COMMENT ON TABLE email_events IS 'Detailed event log for email tracking (opens, clicks, bounces, etc.)';
COMMENT ON COLUMN email_sends.assigned_sdr_id IS 'SDR responsible for this lead - they can see email history in their queue';
COMMENT ON COLUMN email_sends.clicked_urls IS 'Array of URLs that were clicked in this email';
