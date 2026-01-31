-- Update schema for LK Lead Outreach
-- Add new fields to campaign_contacts table for lead outreach

-- Add new columns to campaign_contacts
ALTER TABLE campaign_contacts 
  ADD COLUMN IF NOT EXISTS nome TEXT,
  ADD COLUMN IF NOT EXISTS empresa TEXT,
  ADD COLUMN IF NOT EXISTS cargo TEXT,
  ADD COLUMN IF NOT EXISTS site TEXT,
  ADD COLUMN IF NOT EXISTS dor_especifica TEXT;

-- Migrate existing name to nome if nome is null
UPDATE campaign_contacts 
SET nome = name 
WHERE nome IS NULL AND name IS NOT NULL;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_empresa ON campaign_contacts(empresa);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_nome ON campaign_contacts(nome);

-- Update comments
COMMENT ON COLUMN campaign_contacts.nome IS 'Lead name';
COMMENT ON COLUMN campaign_contacts.empresa IS 'Company name';
COMMENT ON COLUMN campaign_contacts.cargo IS 'Job title/position';
COMMENT ON COLUMN campaign_contacts.site IS 'Company website';
COMMENT ON COLUMN campaign_contacts.dor_especifica IS 'Specific pain point/challenge';

-- Rename clinics table references to companies (keeping table name as clinics for backward compatibility)
-- Note: We'll keep the table name as 'clinics' to avoid breaking existing code, but update comments
COMMENT ON TABLE clinics IS 'Stores company information after license verification';
