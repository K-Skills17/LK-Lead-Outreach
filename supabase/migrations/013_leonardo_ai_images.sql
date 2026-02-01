-- Migration: Add Leonardo AI Analysis Image Support
-- Replaces landing_page_url with analysis_image_url

-- Add new analysis_image_url column to campaign_contacts
ALTER TABLE campaign_contacts 
ADD COLUMN IF NOT EXISTS analysis_image_url TEXT NULL;

-- Add index for quick lookups of leads with analysis images
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_analysis_image_url 
ON campaign_contacts(analysis_image_url) 
WHERE analysis_image_url IS NOT NULL;

-- Optional: Add column to track image generation ID (for future use)
ALTER TABLE campaign_contacts 
ADD COLUMN IF NOT EXISTS analysis_image_generation_id TEXT NULL;

-- Note: We're keeping landing_page_url for backward compatibility during migration
-- You can drop it later if needed:
-- ALTER TABLE campaign_contacts DROP COLUMN IF EXISTS landing_page_url;

-- Add comment to document the change
COMMENT ON COLUMN campaign_contacts.analysis_image_url IS 'URL to Leonardo AI generated analysis image (replaces landing_page_url)';
COMMENT ON COLUMN campaign_contacts.analysis_image_generation_id IS 'Leonardo AI generation ID for tracking image creation';
