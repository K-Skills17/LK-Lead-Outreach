-- Integration with Enrichment Tool
-- This migration allows the outreach tool to read from your enrichment tool's table

-- Option 1: If your enrichment tool uses a different table name, create a view
-- Replace 'enriched_leads' with your actual table name
CREATE OR REPLACE VIEW enriched_leads_view AS
SELECT 
  id,
  nome,
  empresa,
  cargo,
  site,
  dor_especifica,
  phone,
  email,
  -- Add any other fields your enrichment tool provides
  created_at,
  updated_at
FROM enriched_leads; -- Change this to your actual table name

-- Option 2: Create a function to sync leads from enrichment tool to campaigns
CREATE OR REPLACE FUNCTION sync_enriched_leads_to_campaign(
  p_campaign_id UUID,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
  imported INTEGER,
  skipped INTEGER,
  errors TEXT[]
) AS $$
DECLARE
  v_imported INTEGER := 0;
  v_skipped INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_lead RECORD;
  v_normalized_phone TEXT;
BEGIN
  -- Loop through enriched leads that haven't been added to this campaign
  FOR v_lead IN 
    SELECT * FROM enriched_leads_view
    WHERE phone IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM campaign_contacts 
      WHERE campaign_id = p_campaign_id 
      AND phone = normalized_phone(v_lead.phone::TEXT)
    )
    AND NOT EXISTS (
      SELECT 1 FROM do_not_contact 
      WHERE phone = normalized_phone(v_lead.phone::TEXT)
    )
    LIMIT p_limit
  LOOP
    BEGIN
      -- Normalize phone (you may need to adjust this function)
      v_normalized_phone := normalized_phone(v_lead.phone);
      
      -- Insert into campaign_contacts
      INSERT INTO campaign_contacts (
        campaign_id,
        name,
        nome,
        empresa,
        cargo,
        site,
        dor_especifica,
        phone,
        status
      ) VALUES (
        p_campaign_id,
        COALESCE(v_lead.nome, ''),
        v_lead.nome,
        v_lead.empresa,
        v_lead.cargo,
        v_lead.site,
        v_lead.dor_especifica,
        v_normalized_phone,
        'pending'
      );
      
      v_imported := v_imported + 1;
    EXCEPTION WHEN OTHERS THEN
      v_skipped := v_skipped + 1;
      v_errors := array_append(v_errors, 
        format('Error importing %s: %s', v_lead.nome, SQLERRM)
      );
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_imported, v_skipped, v_errors;
END;
$$ LANGUAGE plpgsql;

-- Helper function to normalize phone (adjust based on your needs)
CREATE OR REPLACE FUNCTION normalized_phone(phone_input TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove all non-digit characters except +
  phone_input := regexp_replace(phone_input, '[^0-9+]', '', 'g');
  
  -- If doesn't start with +, assume Brazilian number and add +55
  IF phone_input !~ '^\+' THEN
    phone_input := '+55' || phone_input;
  END IF;
  
  RETURN phone_input;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create index on enriched_leads for faster lookups (if table exists)
-- CREATE INDEX IF NOT EXISTS idx_enriched_leads_phone ON enriched_leads(phone);
-- CREATE INDEX IF NOT EXISTS idx_enriched_leads_empresa ON enriched_leads(empresa);

COMMENT ON FUNCTION sync_enriched_leads_to_campaign IS 'Syncs leads from enrichment tool to a campaign';
COMMENT ON VIEW enriched_leads_view IS 'View of enriched leads from your enrichment tool';
