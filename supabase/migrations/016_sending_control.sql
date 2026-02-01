-- ============================================
-- Sending Control System
-- ============================================
-- Stores sending settings and control state for outreach automation

-- Sending settings table (stores cadence configuration)
CREATE TABLE IF NOT EXISTS sending_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Settings name/description
  name TEXT NOT NULL DEFAULT 'Default Settings',
  description TEXT,
  
  -- Delay settings
  human_mode BOOLEAN DEFAULT true,
  delay_between_messages INTEGER DEFAULT 60, -- seconds
  delay_variation DECIMAL(3,2) DEFAULT 0.2, -- ±20%
  
  -- Break settings
  coffee_break_interval INTEGER DEFAULT 15, -- every N messages
  coffee_break_duration INTEGER DEFAULT 900, -- seconds (15 minutes)
  long_break_interval INTEGER DEFAULT 50, -- every N messages
  long_break_duration INTEGER DEFAULT 2700, -- seconds (45 minutes)
  
  -- Working hours
  working_hours_enabled BOOLEAN DEFAULT true,
  start_time TEXT DEFAULT '10:00', -- HH:MM format
  end_time TEXT DEFAULT '18:00', -- HH:MM format
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  
  -- Contact frequency
  days_since_last_contact INTEGER DEFAULT 3,
  
  -- Daily limits
  daily_limit INTEGER DEFAULT 250,
  daily_limit_warning INTEGER DEFAULT 200,
  
  -- Channel-specific settings
  whatsapp_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  
  -- Active flag
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sending control state table (tracks current sending status)
CREATE TABLE IF NOT EXISTS sending_control_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Control state
  is_running BOOLEAN DEFAULT false,
  is_paused BOOLEAN DEFAULT false,
  paused_until TIMESTAMPTZ, -- Resume time if paused
  
  -- Current session stats
  session_started_at TIMESTAMPTZ,
  session_ended_at TIMESTAMPTZ,
  messages_sent_today INTEGER DEFAULT 0,
  messages_sent_session INTEGER DEFAULT 0,
  
  -- Active settings
  settings_id UUID REFERENCES sending_settings(id) ON DELETE SET NULL,
  
  -- Filters
  sdr_id UUID REFERENCES sdr_users(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  
  -- Last activity
  last_message_sent_at TIMESTAMPTZ,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one active sending state at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_sending_control_unique_active 
ON sending_control_state (is_running) 
WHERE is_running = true;

-- Insert default settings
INSERT INTO sending_settings (name, description, is_active)
VALUES (
  'Default Settings',
  'Default human-like behavior settings for outreach',
  true
) ON CONFLICT DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sending_settings_active ON sending_settings(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sending_control_running ON sending_control_state(is_running) WHERE is_running = true;
CREATE INDEX IF NOT EXISTS idx_sending_control_updated ON sending_control_state(updated_at DESC);

COMMENT ON TABLE sending_settings IS 'Stores cadence and behavior settings for automated outreach';
COMMENT ON TABLE sending_control_state IS 'Tracks current sending state and session statistics';
