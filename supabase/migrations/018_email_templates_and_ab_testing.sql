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

CREATE INDEX idx_email_templates_active ON email_templates(is_active);
CREATE INDEX idx_email_templates_created_by ON email_templates(created_by_admin_email);

-- Email A/B Tests Table (extends existing ab_test_campaigns for email-specific tests)
-- Note: We'll use the existing ab_test_campaigns table but add email-specific fields
ALTER TABLE ab_test_campaigns ADD COLUMN IF NOT EXISTS email_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL;
ALTER TABLE ab_test_campaigns ADD COLUMN IF NOT EXISTS test_channel TEXT DEFAULT 'whatsapp' CHECK (test_channel IN ('whatsapp', 'email', 'both'));

-- Email A/B Test Assignments (link email sends to A/B test variants)
ALTER TABLE email_sends ADD COLUMN IF NOT EXISTS ab_test_id UUID REFERENCES ab_test_campaigns(id) ON DELETE SET NULL;
ALTER TABLE email_sends ADD COLUMN IF NOT EXISTS ab_test_variant_name TEXT;
ALTER TABLE email_sends ADD COLUMN IF NOT EXISTS email_template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL;

CREATE INDEX idx_email_sends_ab_test ON email_sends(ab_test_id);
CREATE INDEX idx_email_sends_ab_test_variant ON email_sends(ab_test_id, ab_test_variant_name);
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

CREATE INDEX idx_email_responses_email_send ON email_responses(email_send_id);
CREATE INDEX idx_email_responses_ab_test ON email_responses(ab_test_id, ab_test_variant_name);
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

CREATE TRIGGER trigger_update_email_template_stats
AFTER INSERT ON email_sends
FOR EACH ROW
EXECUTE FUNCTION update_email_template_stats();
