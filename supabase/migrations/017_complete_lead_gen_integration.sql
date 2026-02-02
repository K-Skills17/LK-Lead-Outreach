-- ============================================
-- Complete Lead Generation Tool Integration
-- ============================================
-- Adds all fields and indexes needed for comprehensive lead data from Lead Gen Engine

-- Add lead_gen_id for tracking leads from Lead Gen Engine
ALTER TABLE campaign_contacts 
  ADD COLUMN IF NOT EXISTS lead_gen_id UUID NULL;

-- Add location fields (if not already present)
ALTER TABLE campaign_contacts 
  ADD COLUMN IF NOT EXISTS location TEXT NULL,
  ADD COLUMN IF NOT EXISTS city TEXT NULL,
  ADD COLUMN IF NOT EXISTS state TEXT NULL,
  ADD COLUMN IF NOT EXISTS country TEXT NULL;

-- Add business quality fields
ALTER TABLE campaign_contacts 
  ADD COLUMN IF NOT EXISTS business_quality_score INTEGER NULL,
  ADD COLUMN IF NOT EXISTS business_quality_tier TEXT NULL CHECK (business_quality_tier IN ('TIER1', 'TIER2', 'TIER3', NULL)),
  ADD COLUMN IF NOT EXISTS is_icp BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS segment TEXT NULL CHECK (segment IN ('VIP', 'HOT', 'WARM', 'COLD', NULL));

-- Add business intelligence fields
ALTER TABLE campaign_contacts 
  ADD COLUMN IF NOT EXISTS business_score INTEGER NULL,
  ADD COLUMN IF NOT EXISTS business_tier TEXT NULL,
  ADD COLUMN IF NOT EXISTS seo_score INTEGER NULL,
  ADD COLUMN IF NOT EXISTS page_score INTEGER NULL,
  ADD COLUMN IF NOT EXISTS social_presence_score INTEGER NULL,
  ADD COLUMN IF NOT EXISTS online_reputation_score INTEGER NULL,
  ADD COLUMN IF NOT EXISTS competitor_count INTEGER NULL;

-- Add opportunities field (complement to pain_points)
ALTER TABLE campaign_contacts 
  ADD COLUMN IF NOT EXISTS opportunities TEXT[] NULL;

-- Add report fields
ALTER TABLE campaign_contacts 
  ADD COLUMN IF NOT EXISTS pdf_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS drive_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS mockup_url TEXT NULL;

-- Add AI-generated content fields
ALTER TABLE campaign_contacts 
  ADD COLUMN IF NOT EXISTS ai_email_intro TEXT NULL,
  ADD COLUMN IF NOT EXISTS ai_email_cta TEXT NULL,
  ADD COLUMN IF NOT EXISTS subject_line TEXT NULL,
  ADD COLUMN IF NOT EXISTS subject_line_score INTEGER NULL,
  ADD COLUMN IF NOT EXISTS personalization_score INTEGER NULL,
  ADD COLUMN IF NOT EXISTS send_time_reason TEXT NULL;

-- Add Google Maps fields
ALTER TABLE campaign_contacts 
  ADD COLUMN IF NOT EXISTS google_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS place_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) NULL,
  ADD COLUMN IF NOT EXISTS reviews INTEGER NULL,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NULL,
  ADD COLUMN IF NOT EXISTS rank INTEGER NULL;

-- Add website/domain fields
ALTER TABLE campaign_contacts 
  ADD COLUMN IF NOT EXISTS domain TEXT NULL,
  ADD COLUMN IF NOT EXISTS full_address TEXT NULL,
  ADD COLUMN IF NOT EXISTS postal_code TEXT NULL,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8) NULL,
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8) NULL,
  ADD COLUMN IF NOT EXISTS logo_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS owner_title TEXT NULL;

-- Add business type/category fields
ALTER TABLE campaign_contacts 
  ADD COLUMN IF NOT EXISTS business_type TEXT NULL,
  ADD COLUMN IF NOT EXISTS category TEXT NULL,
  ADD COLUMN IF NOT EXISTS description TEXT NULL;

-- Add enrichment metadata
ALTER TABLE campaign_contacts 
  ADD COLUMN IF NOT EXISTS all_emails TEXT[] NULL,
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT NULL,
  ADD COLUMN IF NOT EXISTS whatsapp_status TEXT NULL,
  ADD COLUMN IF NOT EXISTS contact_names TEXT[] NULL,
  ADD COLUMN IF NOT EXISTS has_contact_page BOOLEAN NULL,
  ADD COLUMN IF NOT EXISTS has_booking_system BOOLEAN NULL,
  ADD COLUMN IF NOT EXISTS found_on_page TEXT NULL;

-- Add marketing tags (stored as JSONB for flexibility)
-- Note: marketing_tags already exists as TEXT[], but we'll keep enrichment_data for full structure

-- Add source tracking
ALTER TABLE campaign_contacts 
  ADD COLUMN IF NOT EXISTS lead_source TEXT NULL,
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_lead_gen_id ON campaign_contacts(lead_gen_id) WHERE lead_gen_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_location ON campaign_contacts(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_city ON campaign_contacts(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_state ON campaign_contacts(state) WHERE state IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_business_quality_score ON campaign_contacts(business_quality_score) WHERE business_quality_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_business_quality_tier ON campaign_contacts(business_quality_tier) WHERE business_quality_tier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_is_icp ON campaign_contacts(is_icp) WHERE is_icp = true;
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_segment ON campaign_contacts(segment) WHERE segment IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_domain ON campaign_contacts(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_place_id ON campaign_contacts(place_id) WHERE place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_enrichment_data ON campaign_contacts USING GIN(enrichment_data) WHERE enrichment_data IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN campaign_contacts.lead_gen_id IS 'Unique ID from Lead Generation Engine for deduplication';
COMMENT ON COLUMN campaign_contacts.business_quality_score IS 'Overall business quality score (0-100)';
COMMENT ON COLUMN campaign_contacts.business_quality_tier IS 'Business quality tier (TIER1, TIER2, TIER3)';
COMMENT ON COLUMN campaign_contacts.is_icp IS 'Whether this lead matches Ideal Customer Profile';
COMMENT ON COLUMN campaign_contacts.segment IS 'Lead segment (VIP, HOT, WARM, COLD)';
COMMENT ON COLUMN campaign_contacts.enrichment_data IS 'Complete enrichment data from Lead Gen Engine stored as JSONB';
