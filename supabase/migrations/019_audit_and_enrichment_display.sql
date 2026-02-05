-- Audit and enrichment display columns for outreach tool
-- Surfaces public.audits and public.enrichment data in SDR/Admin dashboards

-- GPB completeness score (0-100) from audits
ALTER TABLE campaign_contacts
  ADD COLUMN IF NOT EXISTS gpb_completeness_score INTEGER NULL;

-- Audit results (JSONB); errors like audit timeout / estimated monthly loss filtered in app
ALTER TABLE campaign_contacts
  ADD COLUMN IF NOT EXISTS audit_results JSONB NULL;

-- All phone numbers as potential WhatsApp (so leads show as "with contact" not "without")
ALTER TABLE campaign_contacts
  ADD COLUMN IF NOT EXISTS potential_whatsapp_numbers TEXT[] NULL;

-- marketing_tags may already exist (TEXT[] in 017); merge stores from enrichment in memory

CREATE INDEX IF NOT EXISTS idx_campaign_contacts_gpb_score
  ON campaign_contacts(gpb_completeness_score) WHERE gpb_completeness_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_contacts_audit_results
  ON campaign_contacts USING GIN(audit_results) WHERE audit_results IS NOT NULL;

COMMENT ON COLUMN campaign_contacts.gpb_completeness_score IS 'GPB completeness score 0-100 from audits (or computed from rating/reviews if raw is 25)';
COMMENT ON COLUMN campaign_contacts.audit_results IS 'Audit results JSONB; audit timeout and estimated monthly loss errors filtered in app';
COMMENT ON COLUMN campaign_contacts.potential_whatsapp_numbers IS 'All phone numbers from enrichment/lead as potential WhatsApp';
