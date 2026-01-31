-- ============================================
-- SDR Users and Authentication
-- ============================================
-- This migration creates the structure for SDR accounts
-- SDRs can login, see their messages, replies, and manage their lead queue

-- Create SDR users table
CREATE TABLE IF NOT EXISTS sdr_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'sdr' CHECK (role IN ('sdr', 'manager', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_sdr_users_email ON sdr_users(email);
CREATE INDEX IF NOT EXISTS idx_sdr_users_active ON sdr_users(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE sdr_users ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all SDR users
CREATE POLICY "Service role can manage sdr_users" ON sdr_users FOR ALL USING (true);

-- Add SDR assignment to campaigns (only if campaigns table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    ALTER TABLE campaigns 
    ADD COLUMN IF NOT EXISTS assigned_sdr_id UUID REFERENCES sdr_users(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_campaigns_assigned_sdr ON campaigns(assigned_sdr_id);
  END IF;
END $$;

-- Add SDR assignment to campaign_contacts (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaign_contacts') THEN
    ALTER TABLE campaign_contacts 
    ADD COLUMN IF NOT EXISTS assigned_sdr_id UUID REFERENCES sdr_users(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_campaign_contacts_assigned_sdr ON campaign_contacts(assigned_sdr_id);
  END IF;
END $$;

-- Create message replies table (to track WhatsApp replies)
-- Only create if campaign_contacts exists, otherwise create without foreign key
CREATE TABLE IF NOT EXISTS message_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_contact_id UUID,
  sdr_id UUID REFERENCES sdr_users(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  message_text TEXT NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint only if campaign_contacts exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaign_contacts') THEN
    -- Drop existing constraint if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'message_replies_campaign_contact_id_fkey'
    ) THEN
      ALTER TABLE message_replies DROP CONSTRAINT message_replies_campaign_contact_id_fkey;
    END IF;
    
    -- Add foreign key constraint
    ALTER TABLE message_replies 
    ADD CONSTRAINT message_replies_campaign_contact_id_fkey 
    FOREIGN KEY (campaign_contact_id) 
    REFERENCES campaign_contacts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for message replies
CREATE INDEX IF NOT EXISTS idx_message_replies_contact ON message_replies(campaign_contact_id);
CREATE INDEX IF NOT EXISTS idx_message_replies_sdr ON message_replies(sdr_id);
CREATE INDEX IF NOT EXISTS idx_message_replies_phone ON message_replies(phone);
CREATE INDEX IF NOT EXISTS idx_message_replies_received ON message_replies(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_replies_unread ON message_replies(is_read) WHERE is_read = false;

-- Enable RLS on message_replies
ALTER TABLE message_replies ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all replies
CREATE POLICY "Service role can manage message_replies" ON message_replies FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on sdr_users
DROP TRIGGER IF EXISTS update_sdr_users_updated_at ON sdr_users;
CREATE TRIGGER update_sdr_users_updated_at
  BEFORE UPDATE ON sdr_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to tables
COMMENT ON TABLE sdr_users IS 'SDR (Sales Development Representative) user accounts';
COMMENT ON TABLE message_replies IS 'WhatsApp message replies from leads';
COMMENT ON COLUMN campaigns.assigned_sdr_id IS 'SDR assigned to manage this campaign';
COMMENT ON COLUMN campaign_contacts.assigned_sdr_id IS 'SDR assigned to follow up with this lead';
