-- ============================================
-- Contact History & Human Behavior Support
-- ============================================
-- Tracks when contacts were last reached out to (email/WhatsApp)
-- Enables contact frequency control and human-like behavior simulation

-- Contact history table (tracks all outreach attempts)
CREATE TABLE IF NOT EXISTS contact_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact reference (can be phone or email)
  contact_id UUID REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  phone TEXT, -- Normalized phone number
  email TEXT, -- Email address
  
  -- Outreach details
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'both')),
  message_type TEXT, -- 'initial', 'followup', 'reminder', etc.
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  
  -- SDR assignment
  assigned_sdr_id UUID REFERENCES sdr_users(id) ON DELETE SET NULL,
  
  -- Timing
  contacted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ, -- When it was scheduled to be sent
  
  -- Human behavior tracking
  delay_seconds INTEGER, -- Actual delay used before sending
  was_break BOOLEAN DEFAULT false, -- Whether this was sent after a break
  break_type TEXT, -- 'coffee' (15 messages), 'long' (50 messages), null
  
  -- Status
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message TEXT,
  
  -- Metadata
  times_contacted INTEGER DEFAULT 1, -- How many times this contact has been reached
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_history_contact_id ON contact_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_phone ON contact_history(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_history_email ON contact_history(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_history_contacted_at ON contact_history(contacted_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_history_campaign ON contact_history(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_history_sdr ON contact_history(assigned_sdr_id) WHERE assigned_sdr_id IS NOT NULL;

-- Composite index for checking recent contacts
CREATE INDEX IF NOT EXISTS idx_contact_history_phone_recent ON contact_history(phone, contacted_at DESC) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contact_history_email_recent ON contact_history(email, contacted_at DESC) WHERE email IS NOT NULL;

COMMENT ON TABLE contact_history IS 'Tracks all outreach attempts (email/WhatsApp) for contact frequency control and human behavior simulation';
COMMENT ON COLUMN contact_history.channel IS 'Channel used: email, whatsapp, or both';
COMMENT ON COLUMN contact_history.times_contacted IS 'Total number of times this contact has been reached (incremented per contact)';
COMMENT ON COLUMN contact_history.delay_seconds IS 'Actual delay in seconds used before sending (for human behavior simulation)';
COMMENT ON COLUMN contact_history.break_type IS 'Type of break before this send: coffee (every 15), long (every 50), or null';

-- ============================================
-- Outreach Session Tracking
-- ============================================
-- Tracks active outreach sessions for human behavior (breaks, delays, etc.)

CREATE TABLE IF NOT EXISTS outreach_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Session details
  session_type TEXT NOT NULL CHECK (session_type IN ('email', 'whatsapp', 'both')),
  sdr_id UUID REFERENCES sdr_users(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  
  -- Human behavior counters
  messages_sent INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  last_break_at TIMESTAMPTZ,
  last_break_type TEXT, -- 'coffee', 'long', null
  
  -- Working hours
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paused_at TIMESTAMPTZ, -- When session was paused (outside working hours)
  resumed_at TIMESTAMPTZ, -- When session resumed
  ended_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'stopped')),
  
  -- Settings used
  settings JSONB DEFAULT '{}'::jsonb, -- Human behavior settings used in this session
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outreach_sessions_status ON outreach_sessions(status);
CREATE INDEX IF NOT EXISTS idx_outreach_sessions_sdr ON outreach_sessions(sdr_id) WHERE sdr_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outreach_sessions_campaign ON outreach_sessions(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outreach_sessions_active ON outreach_sessions(status, started_at DESC) WHERE status = 'active';

COMMENT ON TABLE outreach_sessions IS 'Tracks active outreach sessions for human behavior simulation (breaks, delays, working hours)';
COMMENT ON COLUMN outreach_sessions.messages_sent IS 'Number of messages sent in this session (used for break calculations)';
COMMENT ON COLUMN outreach_sessions.settings IS 'JSONB object storing human behavior settings used (delays, breaks, working hours, etc.)';
