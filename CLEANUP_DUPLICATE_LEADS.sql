-- CLEANUP DUPLICATE LEADS
-- This script consolidates multiple rows per session into ONE row with the most complete data

-- Step 1: View the duplicates (for verification before cleanup)
SELECT 
  session_id,
  COUNT(*) as row_count,
  STRING_AGG(status::text, ', ' ORDER BY created_at) as statuses,
  MIN(created_at) as first_created,
  MAX(created_at) as last_updated
FROM leads
GROUP BY session_id
HAVING COUNT(*) > 1
ORDER BY last_updated DESC;

-- Step 2: Consolidate duplicate leads
-- For each session_id, keep only ONE row with the most complete data
WITH ranked_leads AS (
  SELECT 
    *,
    ROW_NUMBER() OVER (
      PARTITION BY session_id 
      ORDER BY 
        CASE 
          WHEN status = 'completed' THEN 1
          WHEN status = 'step2' THEN 2
          WHEN status = 'step1' THEN 3
          WHEN status = 'started' THEN 4
          ELSE 5
        END,
        created_at DESC
    ) as rn
  FROM leads
),
consolidated_data AS (
  SELECT 
    session_id,
    MAX(clinic_name) as clinic_name,
    MAX(name) as name,
    MAX(email) as email,
    MAX(whatsapp) as whatsapp,
    MAX(total_patients) as total_patients,
    MAX(ticket_medio) as ticket_medio,
    MAX(inactive_percent) as inactive_percent,
    MAX(lost_revenue) as lost_revenue,
    MAX(CASE WHEN status = 'completed' THEN status END) as best_status,
    MAX(completed_at) as completed_at,
    MIN(created_at) as created_at
  FROM ranked_leads
  GROUP BY session_id
  HAVING COUNT(*) > 1
)
-- Update the first row with consolidated data
UPDATE leads
SET
  clinic_name = COALESCE(leads.clinic_name, cd.clinic_name),
  name = COALESCE(leads.name, cd.name),
  email = COALESCE(leads.email, cd.email),
  whatsapp = COALESCE(leads.whatsapp, cd.whatsapp),
  total_patients = COALESCE(leads.total_patients, cd.total_patients),
  ticket_medio = COALESCE(leads.ticket_medio, cd.ticket_medio),
  inactive_percent = COALESCE(leads.inactive_percent, cd.inactive_percent),
  lost_revenue = COALESCE(leads.lost_revenue, cd.lost_revenue),
  status = COALESCE(cd.best_status, leads.status),
  completed_at = COALESCE(leads.completed_at, cd.completed_at)
FROM consolidated_data cd
WHERE leads.session_id = cd.session_id
  AND leads.id IN (
    SELECT id 
    FROM ranked_leads 
    WHERE session_id = cd.session_id AND rn = 1
  );

-- Step 3: Delete the duplicate rows (keep only the first one per session)
DELETE FROM leads
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY session_id 
        ORDER BY 
          CASE 
            WHEN status = 'completed' THEN 1
            WHEN status = 'step2' THEN 2
            WHEN status = 'step1' THEN 3
            WHEN status = 'started' THEN 4
            ELSE 5
          END,
          created_at DESC
      ) as rn
    FROM leads
  ) ranked
  WHERE rn > 1
);

-- Step 4: Verify cleanup (should show no duplicates)
SELECT 
  session_id,
  COUNT(*) as row_count
FROM leads
GROUP BY session_id
HAVING COUNT(*) > 1;

-- Step 5: View final consolidated leads
SELECT 
  session_id,
  clinic_name,
  name,
  email,
  status,
  created_at,
  completed_at
FROM leads
ORDER BY created_at DESC
LIMIT 20;
