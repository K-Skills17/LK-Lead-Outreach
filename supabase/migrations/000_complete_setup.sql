-- ============================================
-- COMPLETE SETUP MIGRATION
-- ============================================
-- Run this ONE migration to set up everything
-- Safe to run multiple times (idempotent)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CLINICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_key TEXT,
  email TEXT NOT NULL,
  clinic_name TEXT,
  tier TEXT NOT NULL DEFAULT 'FREE' CHECK (tier IN ('FREE', 'PRO', 'PREMIUM')),
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinics_license_key ON clinics(license_key) WHERE license_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clinics_email ON clinics(email);

-- ============================================
-- 2. CAMPAIGNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add clinic_id column if it doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'campaigns' AND column_name = 'clinic_id'
    ) THEN
      ALTER TABLE campaigns 
      ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaigns_clinic_id ON campaigns(clinic_id) WHERE clinic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- ============================================
-- 3. CAMPAIGN_CONTACTS TABLE (with CSV fields)
-- ============================================
CREATE TABLE IF NOT EXISTS campaign_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Keep for backward compatibility
  nome TEXT, -- Lead name (from CSV)
  empresa TEXT, -- Company name (from CSV)
  cargo TEXT, -- Job title (from CSV)
  site TEXT, -- Website (from CSV)
  dor_especifica TEXT, -- Pain point (from CSV)
  phone TEXT NOT NULL, -- E.164 format: +5511987654321
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  personalized_message TEXT,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign_id ON campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_status ON campaign_contacts(status);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_phone ON campaign_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_queue ON campaign_contacts(campaign_id, status) WHERE status = 'pending';

-- ============================================
-- 4. SDR USERS TABLE
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_sdr_users_email ON sdr_users(email);
CREATE INDEX IF NOT EXISTS idx_sdr_users_active ON sdr_users(is_active) WHERE is_active = true;

-- ============================================
-- 5. ADD SDR ASSIGNMENT TO CAMPAIGNS
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'campaigns' AND column_name = 'assigned_sdr_id'
    ) THEN
      ALTER TABLE campaigns 
      ADD COLUMN assigned_sdr_id UUID REFERENCES sdr_users(id) ON DELETE SET NULL;
      
      CREATE INDEX IF NOT EXISTS idx_campaigns_assigned_sdr ON campaigns(assigned_sdr_id);
    END IF;
  END IF;
END $$;

-- ============================================
-- 6. ADD SDR ASSIGNMENT TO CAMPAIGN_CONTACTS
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaign_contacts') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'campaign_contacts' AND column_name = 'assigned_sdr_id'
    ) THEN
      ALTER TABLE campaign_contacts 
      ADD COLUMN assigned_sdr_id UUID REFERENCES sdr_users(id) ON DELETE SET NULL;
      
      CREATE INDEX IF NOT EXISTS idx_campaign_contacts_assigned_sdr ON campaign_contacts(assigned_sdr_id);
    END IF;
  END IF;
END $$;

-- ============================================
-- 7. MESSAGE REPLIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS message_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_contact_id UUID REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  sdr_id UUID REFERENCES sdr_users(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  message_text TEXT NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_replies_contact ON message_replies(campaign_contact_id);
CREATE INDEX IF NOT EXISTS idx_message_replies_sdr ON message_replies(sdr_id);
CREATE INDEX IF NOT EXISTS idx_message_replies_phone ON message_replies(phone);
CREATE INDEX IF NOT EXISTS idx_message_replies_received ON message_replies(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_replies_unread ON message_replies(is_read) WHERE is_read = false;

-- ============================================
-- 8. OTHER SUPPORTING TABLES
-- ============================================

-- Message drafts
CREATE TABLE IF NOT EXISTS message_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_drafts_clinic_id ON message_drafts(clinic_id);

-- Do not contact blocklist
CREATE TABLE IF NOT EXISTS do_not_contact (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL UNIQUE,
  reason TEXT,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_do_not_contact_phone ON do_not_contact(phone);

-- AI usage daily
CREATE TABLE IF NOT EXISTS ai_usage_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL CHECK (tier IN ('FREE', 'PRO', 'PREMIUM')),
  daily_limit INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(clinic_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_clinic_date ON ai_usage_daily(clinic_id, usage_date);

-- ============================================
-- 9. FUNCTIONS AND TRIGGERS
-- ============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_clinics_updated_at ON clinics;
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaign_contacts_updated_at ON campaign_contacts;
CREATE TRIGGER update_campaign_contacts_updated_at BEFORE UPDATE ON campaign_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_message_drafts_updated_at ON message_drafts;
CREATE TRIGGER update_message_drafts_updated_at BEFORE UPDATE ON message_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_usage_daily_updated_at ON ai_usage_daily;
CREATE TRIGGER update_ai_usage_daily_updated_at BEFORE UPDATE ON ai_usage_daily
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sdr_users_updated_at ON sdr_users;
CREATE TRIGGER update_sdr_users_updated_at BEFORE UPDATE ON sdr_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. ROW LEVEL SECURITY
-- ============================================

-- Disable RLS on main tables (service-role only access)
ALTER TABLE clinics DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_drafts DISABLE ROW LEVEL SECURITY;
ALTER TABLE do_not_contact DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_daily DISABLE ROW LEVEL SECURITY;

-- Enable RLS on SDR tables
ALTER TABLE sdr_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_replies ENABLE ROW LEVEL SECURITY;

-- Policies for SDR tables
DROP POLICY IF EXISTS "Service role can manage sdr_users" ON sdr_users;
CREATE POLICY "Service role can manage sdr_users" ON sdr_users FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role can manage message_replies" ON message_replies;
CREATE POLICY "Service role can manage message_replies" ON message_replies FOR ALL USING (true);

-- ============================================
-- 11. COMMENTS
-- ============================================
COMMENT ON TABLE clinics IS 'Stores clinic/company information';
COMMENT ON TABLE campaigns IS 'Campaign metadata and status tracking';
COMMENT ON TABLE campaign_contacts IS 'Individual leads within campaigns with CSV enrichment data';
COMMENT ON TABLE sdr_users IS 'SDR (Sales Development Representative) user accounts';
COMMENT ON TABLE message_replies IS 'WhatsApp message replies from leads';
COMMENT ON TABLE message_drafts IS 'Saved message templates for reuse';
COMMENT ON TABLE do_not_contact IS 'Global blocklist for contacts that should not be messaged';
COMMENT ON TABLE ai_usage_daily IS 'Daily AI generation usage tracking';
COMMENT ON COLUMN campaigns.assigned_sdr_id IS 'SDR assigned to manage this campaign';
COMMENT ON COLUMN campaign_contacts.assigned_sdr_id IS 'SDR assigned to follow up with this lead';

-- ============================================
-- ✅ SETUP COMPLETE!
-- ============================================
-- All tables, indexes, triggers, and policies are now created
-- Safe to run this migration multiple times
-- ============================================
