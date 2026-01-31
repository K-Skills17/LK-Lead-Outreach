-- LK Reactor Campaign Management Schema
-- This migration creates all tables for campaign management, contact tracking, and AI usage

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clinics table - stores clinic info after license verification
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_key TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  clinic_name TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('FREE', 'PRO', 'PREMIUM')),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinics_license_key ON clinics(license_key);
CREATE INDEX IF NOT EXISTS idx_clinics_email ON clinics(email);

-- Campaigns table - campaign metadata
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_clinic_id ON campaigns(clinic_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Campaign contacts - contacts per campaign
CREATE TABLE IF NOT EXISTS campaign_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
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

-- Message drafts - saved draft templates
CREATE TABLE IF NOT EXISTS message_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_drafts_clinic_id ON message_drafts(clinic_id);

-- Do not contact - global blocklist
CREATE TABLE IF NOT EXISTS do_not_contact (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL UNIQUE, -- E.164 format
  reason TEXT,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_do_not_contact_phone ON do_not_contact(phone);

-- AI usage daily - track daily AI generations
CREATE TABLE IF NOT EXISTS ai_usage_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL CHECK (tier IN ('FREE', 'PRO', 'PREMIUM')),
  daily_limit INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(clinic_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_clinic_date ON ai_usage_daily(clinic_id, usage_date);

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to all tables (drop first if exists)
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

-- Disable RLS (service-role only access from backend)
ALTER TABLE clinics DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_drafts DISABLE ROW LEVEL SECURITY;
ALTER TABLE do_not_contact DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_daily DISABLE ROW LEVEL SECURITY;

-- Comments for documentation
COMMENT ON TABLE clinics IS 'Stores clinic information after license verification';
COMMENT ON TABLE campaigns IS 'Campaign metadata and status tracking';
COMMENT ON TABLE campaign_contacts IS 'Individual contacts within campaigns with send status';
COMMENT ON TABLE message_drafts IS 'Saved message templates for reuse';
COMMENT ON TABLE do_not_contact IS 'Global blocklist for contacts that should not be messaged';
COMMENT ON TABLE ai_usage_daily IS 'Daily AI generation usage tracking with tier-based limits';
