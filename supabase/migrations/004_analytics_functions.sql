-- Function to get daily analytics breakdown
CREATE OR REPLACE FUNCTION get_daily_analytics(start_date TIMESTAMPTZ)
RETURNS TABLE (
  date DATE,
  visitors BIGINT,
  unique_visitors BIGINT,
  leads BIGINT,
  completed_leads BIGINT,
  abandoned_leads BIGINT,
  downloads BIGINT,
  free_downloads BIGINT,
  professional_downloads BIGINT,
  premium_downloads BIGINT,
  payments_initiated BIGINT,
  payments_completed BIGINT,
  revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(pv.created_at) as date,
    COUNT(pv.id) as visitors,
    COUNT(DISTINCT pv.session_id) as unique_visitors,
    COUNT(DISTINCT l.id) as leads,
    COUNT(DISTINCT CASE WHEN l.status = 'completed' THEN l.id END) as completed_leads,
    COUNT(DISTINCT CASE WHEN l.status IN ('started', 'step1', 'step2') THEN l.id END) as abandoned_leads,
    COUNT(DISTINCT d.id) as downloads,
    COUNT(DISTINCT CASE WHEN d.plan_type = 'free' THEN d.id END) as free_downloads,
    COUNT(DISTINCT CASE WHEN d.plan_type = 'professional' THEN d.id END) as professional_downloads,
    COUNT(DISTINCT CASE WHEN d.plan_type = 'premium' THEN d.id END) as premium_downloads,
    COUNT(DISTINCT CASE WHEN pe.status = 'initiated' THEN pe.id END) as payments_initiated,
    COUNT(DISTINCT CASE WHEN pe.status = 'completed' THEN pe.id END) as payments_completed,
    COALESCE(SUM(CASE WHEN pe.status = 'completed' THEN pe.amount ELSE 0 END), 0) as revenue
  FROM page_views pv
  LEFT JOIN leads l ON pv.session_id = l.session_id AND DATE(pv.created_at) = DATE(l.created_at)
  LEFT JOIN downloads d ON pv.session_id = d.session_id AND DATE(pv.created_at) = DATE(d.created_at)
  LEFT JOIN payment_events pe ON pv.session_id = pe.session_id AND DATE(pv.created_at) = DATE(pe.created_at)
  WHERE pv.created_at >= start_date
  GROUP BY DATE(pv.created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;
