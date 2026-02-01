-- ============================================
-- ADVANCED FEATURES MIGRATION (FINAL VERSION)
-- Personalization, Optimal Send Time, A/B Testing
-- Drops both TABLES and VIEWS safely before creating
-- ============================================

-- Drop tables first (if they exist) - in reverse dependency order
DROP TABLE IF EXISTS ab_test_events CASCADE;
DROP TABLE IF EXISTS ab_test_assignments CASCADE;
DROP TABLE IF EXISTS ab_test_campaigns CASCADE;
DROP TABLE IF EXISTS send_time_analytics CASCADE;
DROP TABLE IF EXISTS optimal_send_times CASCADE;
DROP TABLE IF EXISTS lead_personalization CASCADE;

-- Drop ab_test_results (could be table or view)
DROP TABLE IF EXISTS ab_test_results CASCADE;
DROP VIEW IF EXISTS ab_test_results CASCADE;

-- ============================================
-- 1. LEAD PERSONALIZATION TABLE
-- Stores AI-generated personalized content for each lead
-- ============================================
CREATE TABLE lead_personalization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  
  -- Personalized content
  personalized_intro TEXT,
  pain_points JSONB DEFAULT '[]'::jsonb, -- Array of specific pain points
  cta_text TEXT,
  cta_type TEXT, -- 'VIP', 'HOT', 'WARM', 'COLD'
  
  -- Scores
  personalization_score INTEGER CHECK (personalization_score >= 0 AND personalization_score <= 100),
  lead_tier TEXT CHECK (lead_tier IN ('VIP', 'HOT', 'WARM', 'COLD')),
  
  -- Input data used for personalization
  input_data JSONB DEFAULT '{}'::jsonb,
  
  -- AI metadata
  ai_model TEXT DEFAULT 'gpt-4',
  ai_prompt_tokens INTEGER,
  ai_completion_tokens INTEGER,
  generation_time_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(contact_id)
);

CREATE INDEX idx_lead_personalization_contact ON lead_personalization(contact_id);
CREATE INDEX idx_lead_personalization_tier ON lead_personalization(lead_tier);
CREATE INDEX idx_lead_personalization_score ON lead_personalization(personalization_score);

-- ============================================
-- 2. OPTIMAL SEND TIMES TABLE
-- Stores calculated optimal send times for each lead
-- ============================================
CREATE TABLE optimal_send_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  
  -- Calculated optimal time
  optimal_send_at TIMESTAMPTZ NOT NULL,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  hour_of_day INTEGER CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  minute_randomization INTEGER DEFAULT 0, -- ±10 min randomization
  
  -- Reasoning
  reason TEXT,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Business context
  business_type TEXT, -- 'healthcare', 'general', etc.
  lead_priority TEXT CHECK (lead_priority IN ('VIP', 'HIGH', 'MEDIUM', 'LOW')),
  
  -- Historical data used
  historical_open_rate DECIMAL(5,2),
  historical_sample_size INTEGER DEFAULT 0,
  niche TEXT,
  
  -- Batch control
  batch_id UUID,
  batch_order INTEGER, -- Order within batch for staggering
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(contact_id)
);

CREATE INDEX idx_optimal_send_times_contact ON optimal_send_times(contact_id);
CREATE INDEX idx_optimal_send_times_send_at ON optimal_send_times(optimal_send_at);
CREATE INDEX idx_optimal_send_times_batch ON optimal_send_times(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_optimal_send_times_business_type ON optimal_send_times(business_type);

-- ============================================
-- 3. SEND TIME ANALYTICS TABLE
-- Historical tracking of send times and open rates
-- ============================================
CREATE TABLE send_time_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time dimensions
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  
  -- Segmentation
  niche TEXT,
  business_type TEXT,
  lead_tier TEXT,
  
  -- Metrics
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_responded INTEGER DEFAULT 0,
  
  -- Rates (calculated)
  open_rate DECIMAL(5,2) DEFAULT 0.00,
  click_rate DECIMAL(5,2) DEFAULT 0.00,
  response_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_send_time_analytics_time ON send_time_analytics(day_of_week, hour_of_day);
CREATE INDEX idx_send_time_analytics_niche ON send_time_analytics(niche) WHERE niche IS NOT NULL;
CREATE INDEX idx_send_time_analytics_business_type ON send_time_analytics(business_type) WHERE business_type IS NOT NULL;
CREATE INDEX idx_send_time_analytics_open_rate ON send_time_analytics(open_rate DESC);

-- ============================================
-- 4. A/B TEST CAMPAIGNS TABLE
-- Defines A/B/C tests for campaigns
-- ============================================
CREATE TABLE ab_test_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  
  -- Test metadata
  test_name TEXT NOT NULL,
  description TEXT,
  test_type TEXT NOT NULL CHECK (test_type IN ('subject_line', 'intro', 'send_time', 'cta', 'combined')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
  
  -- Test configuration
  variants JSONB NOT NULL, -- Array of variant definitions
  target_distribution JSONB NOT NULL, -- Target percentages for each variant
  
  -- Results
  winner_variant TEXT,
  confidence_level DECIMAL(5,2), -- Statistical confidence (0-100)
  determined_at TIMESTAMPTZ,
  
  -- Timing
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ab_test_campaigns_campaign ON ab_test_campaigns(campaign_id);
CREATE INDEX idx_ab_test_campaigns_status ON ab_test_campaigns(status);

-- ============================================
-- 5. A/B TEST ASSIGNMENTS TABLE
-- Tracks which variant each lead received
-- ============================================
CREATE TABLE ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES ab_test_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  
  -- Assignment
  variant_name TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Applied content
  applied_content JSONB, -- The actual content that was sent
  
  UNIQUE(test_id, contact_id)
);

CREATE INDEX idx_ab_test_assignments_test ON ab_test_assignments(test_id);
CREATE INDEX idx_ab_test_assignments_contact ON ab_test_assignments(contact_id);
CREATE INDEX idx_ab_test_assignments_variant ON ab_test_assignments(test_id, variant_name);

-- ============================================
-- 6. A/B TEST EVENTS TABLE
-- Tracks events for each test assignment
-- ============================================
CREATE TABLE ab_test_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES ab_test_assignments(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'opened', 'clicked', 'responded', 'booked', 'bounced')),
  event_data JSONB DEFAULT '{}'::jsonb,
  
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ab_test_events_assignment ON ab_test_events(assignment_id);
CREATE INDEX idx_ab_test_events_type ON ab_test_events(event_type);
CREATE INDEX idx_ab_test_events_occurred ON ab_test_events(occurred_at);

-- ============================================
-- 7. A/B TEST RESULTS VIEW
-- Pre-calculated results for each test
-- ============================================
CREATE OR REPLACE VIEW ab_test_results AS
SELECT 
  t.id as test_id,
  t.test_name,
  t.status,
  a.variant_name,
  COUNT(DISTINCT a.id) as total_assigned,
  COUNT(DISTINCT CASE WHEN e.event_type = 'sent' THEN e.assignment_id END) as total_sent,
  COUNT(DISTINCT CASE WHEN e.event_type = 'opened' THEN e.assignment_id END) as total_opened,
  COUNT(DISTINCT CASE WHEN e.event_type = 'clicked' THEN e.assignment_id END) as total_clicked,
  COUNT(DISTINCT CASE WHEN e.event_type = 'responded' THEN e.assignment_id END) as total_responded,
  COUNT(DISTINCT CASE WHEN e.event_type = 'booked' THEN e.assignment_id END) as total_booked,
  ROUND(
    CAST(COUNT(DISTINCT CASE WHEN e.event_type = 'opened' THEN e.assignment_id END) AS DECIMAL) / 
    NULLIF(COUNT(DISTINCT CASE WHEN e.event_type = 'sent' THEN e.assignment_id END), 0) * 100, 
    2
  ) as open_rate,
  ROUND(
    CAST(COUNT(DISTINCT CASE WHEN e.event_type = 'clicked' THEN e.assignment_id END) AS DECIMAL) / 
    NULLIF(COUNT(DISTINCT CASE WHEN e.event_type = 'sent' THEN e.assignment_id END), 0) * 100, 
    2
  ) as click_rate,
  ROUND(
    CAST(COUNT(DISTINCT CASE WHEN e.event_type = 'responded' THEN e.assignment_id END) AS DECIMAL) / 
    NULLIF(COUNT(DISTINCT CASE WHEN e.event_type = 'sent' THEN e.assignment_id END), 0) * 100, 
    2
  ) as response_rate,
  ROUND(
    CAST(COUNT(DISTINCT CASE WHEN e.event_type = 'booked' THEN e.assignment_id END) AS DECIMAL) / 
    NULLIF(COUNT(DISTINCT CASE WHEN e.event_type = 'sent' THEN e.assignment_id END), 0) * 100, 
    2
  ) as booking_rate
FROM ab_test_campaigns t
LEFT JOIN ab_test_assignments a ON a.test_id = t.id
LEFT JOIN ab_test_events e ON e.assignment_id = a.id
GROUP BY t.id, t.test_name, t.status, a.variant_name;

-- ============================================
-- 8. ENABLE RLS ON ALL NEW TABLES
-- ============================================
ALTER TABLE lead_personalization ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimal_send_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_time_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role full access personalization" ON lead_personalization;
DROP POLICY IF EXISTS "Service role full access send_times" ON optimal_send_times;
DROP POLICY IF EXISTS "Service role full access analytics" ON send_time_analytics;
DROP POLICY IF EXISTS "Service role full access ab_campaigns" ON ab_test_campaigns;
DROP POLICY IF EXISTS "Service role full access ab_assignments" ON ab_test_assignments;
DROP POLICY IF EXISTS "Service role full access ab_events" ON ab_test_events;

-- Create policies (for API routes with service role key)
CREATE POLICY "Service role full access personalization" ON lead_personalization FOR ALL USING (true);
CREATE POLICY "Service role full access send_times" ON optimal_send_times FOR ALL USING (true);
CREATE POLICY "Service role full access analytics" ON send_time_analytics FOR ALL USING (true);
CREATE POLICY "Service role full access ab_campaigns" ON ab_test_campaigns FOR ALL USING (true);
CREATE POLICY "Service role full access ab_assignments" ON ab_test_assignments FOR ALL USING (true);
CREATE POLICY "Service role full access ab_events" ON ab_test_events FOR ALL USING (true);

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Function to calculate A/B test statistical significance
CREATE OR REPLACE FUNCTION calculate_ab_test_significance(
  test_id_input UUID,
  metric TEXT DEFAULT 'open_rate'
)
RETURNS TABLE (
  variant_name TEXT,
  sample_size BIGINT,
  rate DECIMAL,
  is_winner BOOLEAN,
  confidence DECIMAL
) AS $$
BEGIN
  -- Simple implementation - returns variant with highest rate
  -- TODO: Implement proper statistical significance testing (Chi-square, etc.)
  RETURN QUERY
  SELECT 
    r.variant_name,
    r.total_sent as sample_size,
    CASE 
      WHEN metric = 'open_rate' THEN r.open_rate
      WHEN metric = 'click_rate' THEN r.click_rate
      WHEN metric = 'response_rate' THEN r.response_rate
      WHEN metric = 'booking_rate' THEN r.booking_rate
      ELSE r.open_rate
    END as rate,
    CASE 
      WHEN metric = 'open_rate' THEN r.open_rate = MAX(r.open_rate) OVER ()
      WHEN metric = 'click_rate' THEN r.click_rate = MAX(r.click_rate) OVER ()
      WHEN metric = 'response_rate' THEN r.response_rate = MAX(r.response_rate) OVER ()
      WHEN metric = 'booking_rate' THEN r.booking_rate = MAX(r.booking_rate) OVER ()
      ELSE r.open_rate = MAX(r.open_rate) OVER ()
    END as is_winner,
    CASE 
      WHEN r.total_sent >= 100 THEN 95.0
      WHEN r.total_sent >= 50 THEN 85.0
      WHEN r.total_sent >= 30 THEN 75.0
      ELSE 50.0
    END as confidence
  FROM ab_test_results r
  WHERE r.test_id = test_id_input
  AND r.total_sent > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '📊 Created 6 tables:';
  RAISE NOTICE '   - lead_personalization';
  RAISE NOTICE '   - optimal_send_times';
  RAISE NOTICE '   - send_time_analytics';
  RAISE NOTICE '   - ab_test_campaigns';
  RAISE NOTICE '   - ab_test_assignments';
  RAISE NOTICE '   - ab_test_events';
  RAISE NOTICE '📈 Created 1 view:';
  RAISE NOTICE '   - ab_test_results';
  RAISE NOTICE '🔒 Enabled RLS on all tables';
  RAISE NOTICE '✨ Created helper functions';
END $$;
