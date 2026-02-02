-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  
  -- Template variables (for personalization)
  variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names like ["nome", "empresa", "cargo"]
  
  -- Metadata
  created_by_admin_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  -- Usage stats
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ
);

-- Add columns if they don't exist (in case table was created before)
DO $$ 
BEGIN
  -- Add created_by_admin_email if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_templates' AND column_name = 'created_by_admin_email') THEN
    ALTER TABLE email_templates ADD COLUMN created_by_admin_email TEXT;
  END IF;
  
  -- Add is_active if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_templates' AND column_name = 'is_active') THEN
    ALTER TABLE email_templates ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  
  -- Add times_used if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_templates' AND column_name = 'times_used') THEN
    ALTER TABLE email_templates ADD COLUMN times_used INTEGER DEFAULT 0;
  END IF;
  
  -- Add last_used_at if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_templates' AND column_name = 'last_used_at') THEN
    ALTER TABLE email_templates ADD COLUMN last_used_at TIMESTAMPTZ;
  END IF;
  
  -- Add variables if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_templates' AND column_name = 'variables') THEN
    ALTER TABLE email_templates ADD COLUMN variables JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create indexes (drop first if they exist to avoid errors, only create if columns exist)
DO $$ 
BEGIN
  -- Create is_active index if column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'email_templates' AND column_name = 'is_active') THEN
    DROP INDEX IF EXISTS idx_email_templates_active;
    CREATE INDEX idx_email_templates_active ON email_templates(is_active);
  END IF;
  
  -- Create created_by_admin_email index if column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'email_templates' AND column_name = 'created_by_admin_email') THEN
    DROP INDEX IF EXISTS idx_email_templates_created_by;
    CREATE INDEX idx_email_templates_created_by ON email_templates(created_by_admin_email);
  END IF;
END $$;

-- Email A/B Tests Table (extends existing ab_test_campaigns for email-specific tests)
-- Note: We'll use the existing ab_test_campaigns table but add email-specific fields
DO $$ 
BEGIN
  -- Add email_template_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ab_test_campaigns' AND column_name = 'email_template_id') THEN
    ALTER TABLE ab_test_campaigns ADD COLUMN email_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL;
  END IF;
  
  -- Add test_channel if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ab_test_campaigns' AND column_name = 'test_channel') THEN
    ALTER TABLE ab_test_campaigns ADD COLUMN test_channel TEXT DEFAULT 'whatsapp';
    -- Add check constraint separately
    ALTER TABLE ab_test_campaigns ADD CONSTRAINT ab_test_campaigns_test_channel_check 
      CHECK (test_channel IN ('whatsapp', 'email', 'both'));
  END IF;
END $$;

-- Email A/B Test Assignments (link email sends to A/B test variants)
DO $$ 
BEGIN
  -- Add ab_test_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_sends' AND column_name = 'ab_test_id') THEN
    ALTER TABLE email_sends ADD COLUMN ab_test_id UUID REFERENCES ab_test_campaigns(id) ON DELETE SET NULL;
  END IF;
  
  -- Add ab_test_variant_name if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_sends' AND column_name = 'ab_test_variant_name') THEN
    ALTER TABLE email_sends ADD COLUMN ab_test_variant_name TEXT;
  END IF;
  
  -- Add email_template_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'email_sends' AND column_name = 'email_template_id') THEN
    ALTER TABLE email_sends ADD COLUMN email_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes (drop first if they exist)
DROP INDEX IF EXISTS idx_email_sends_ab_test;
CREATE INDEX idx_email_sends_ab_test ON email_sends(ab_test_id);

DROP INDEX IF EXISTS idx_email_sends_ab_test_variant;
CREATE INDEX idx_email_sends_ab_test_variant ON email_sends(ab_test_id, ab_test_variant_name);

DROP INDEX IF EXISTS idx_email_sends_template;
CREATE INDEX idx_email_sends_template ON email_sends(email_template_id);

-- Email Response Tracking (to track which variations get responses)
CREATE TABLE IF NOT EXISTS email_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_send_id UUID NOT NULL REFERENCES email_sends(id) ON DELETE CASCADE,
  ab_test_id UUID REFERENCES ab_test_campaigns(id) ON DELETE SET NULL,
  ab_test_variant_name TEXT,
  
  -- Response data
  response_type TEXT NOT NULL CHECK (response_type IN ('reply', 'click', 'booking', 'conversion')),
  response_content TEXT, -- For replies, store the reply text
  response_url TEXT, -- For clicks, store the clicked URL
  response_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for email_responses (drop first if they exist)
DROP INDEX IF EXISTS idx_email_responses_email_send;
CREATE INDEX idx_email_responses_email_send ON email_responses(email_send_id);

DROP INDEX IF EXISTS idx_email_responses_ab_test;
CREATE INDEX idx_email_responses_ab_test ON email_responses(ab_test_id, ab_test_variant_name);

DROP INDEX IF EXISTS idx_email_responses_type;
CREATE INDEX idx_email_responses_type ON email_responses(response_type);

-- Function to update template usage stats
CREATE OR REPLACE FUNCTION update_email_template_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_template_id IS NOT NULL THEN
    UPDATE email_templates
    SET 
      times_used = times_used + 1,
      last_used_at = NOW()
    WHERE id = NEW.email_template_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create
DROP TRIGGER IF EXISTS trigger_update_email_template_stats ON email_sends;
CREATE TRIGGER trigger_update_email_template_stats
AFTER INSERT ON email_sends
FOR EACH ROW
EXECUTE FUNCTION update_email_template_stats();
