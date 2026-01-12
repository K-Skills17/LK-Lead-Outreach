-- Analytics and Tracking Tables

-- Page Views Tracking
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_page_views_session ON page_views(session_id);
CREATE INDEX idx_page_views_created_at ON page_views(created_at);
CREATE INDEX idx_page_views_page_path ON page_views(page_path);

-- Lead Capture Tracking (Form Submissions)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  clinic_name TEXT,
  name TEXT,
  email TEXT,
  whatsapp TEXT,
  total_patients INTEGER,
  ticket_medio NUMERIC(10,2),
  inactive_percent INTEGER,
  lost_revenue NUMERIC(10,2),
  status TEXT DEFAULT 'completed', -- 'started', 'step1', 'step2', 'completed', 'abandoned'
  abandoned_at_step INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_leads_session ON leads(session_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created_at ON leads(created_at);

-- Download Tracking
CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  email TEXT,
  plan_type TEXT NOT NULL, -- 'free', 'professional', 'premium'
  license_key TEXT,
  source_page TEXT, -- '/setup', '/precos', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_downloads_session ON downloads(session_id);
CREATE INDEX idx_downloads_plan_type ON downloads(plan_type);
CREATE INDEX idx_downloads_email ON downloads(email);
CREATE INDEX idx_downloads_created_at ON downloads(created_at);

-- Conversion Events (for Facebook Pixel)
CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  event_name TEXT NOT NULL, -- 'PageView', 'ViewContent', 'Lead', 'InitiateCheckout', 'Purchase', 'CompleteRegistration'
  event_value NUMERIC(10,2),
  event_data JSONB,
  fb_pixel_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversion_events_session ON conversion_events(session_id);
CREATE INDEX idx_conversion_events_name ON conversion_events(event_name);
CREATE INDEX idx_conversion_events_created_at ON conversion_events(created_at);

-- Payment Tracking
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  email TEXT,
  plan_type TEXT NOT NULL, -- 'professional', 'premium'
  amount NUMERIC(10,2),
  status TEXT NOT NULL, -- 'initiated', 'completed', 'failed', 'pending'
  payment_provider TEXT DEFAULT 'mercadopago',
  payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_events_session ON payment_events(session_id);
CREATE INDEX idx_payment_events_status ON payment_events(status);
CREATE INDEX idx_payment_events_email ON payment_events(email);
CREATE INDEX idx_payment_events_created_at ON payment_events(created_at);

-- Analytics Summary View (for dashboard)
CREATE OR REPLACE VIEW analytics_summary AS
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT session_id) as unique_visitors,
  COUNT(*) as total_page_views
FROM page_views
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Conversion Funnel View
CREATE OR REPLACE VIEW conversion_funnel AS
SELECT
  DATE(pv.created_at) as date,
  COUNT(DISTINCT pv.session_id) as visitors,
  COUNT(DISTINCT l.session_id) as leads_started,
  COUNT(DISTINCT CASE WHEN l.status = 'completed' THEN l.session_id END) as leads_completed,
  COUNT(DISTINCT d.session_id) as downloads_total,
  COUNT(DISTINCT CASE WHEN d.plan_type = 'free' THEN d.session_id END) as downloads_free,
  COUNT(DISTINCT CASE WHEN d.plan_type = 'professional' THEN d.session_id END) as downloads_professional,
  COUNT(DISTINCT CASE WHEN d.plan_type = 'premium' THEN d.session_id END) as downloads_premium,
  COUNT(DISTINCT pe.session_id) as payments_initiated,
  COUNT(DISTINCT CASE WHEN pe.status = 'completed' THEN pe.session_id END) as payments_completed
FROM page_views pv
LEFT JOIN leads l ON pv.session_id = l.session_id
LEFT JOIN downloads d ON pv.session_id = d.session_id
LEFT JOIN payment_events pe ON pv.session_id = pe.session_id
GROUP BY DATE(pv.created_at)
ORDER BY date DESC;

-- RLS Policies (Restrict access to admin only)
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- Allow service role to read/write (for API endpoints)
CREATE POLICY "Service role can manage page_views" ON page_views FOR ALL USING (true);
CREATE POLICY "Service role can manage leads" ON leads FOR ALL USING (true);
CREATE POLICY "Service role can manage downloads" ON downloads FOR ALL USING (true);
CREATE POLICY "Service role can manage conversion_events" ON conversion_events FOR ALL USING (true);
CREATE POLICY "Service role can manage payment_events" ON payment_events FOR ALL USING (true);
