# 📊 LEAD SUBMISSION - COMPLETE EXPLANATION

## ❓ **WHAT IS A "LEAD SUBMISSION"?**

A **lead submission** happens when a visitor completes your **3-step diagnostic form** on the landing page (`/`).

### **Definition:**
A "lead" is a potential customer who:
1. ✅ Entered their business data (Step 1: Total patients, ticket médio, inactive %)
2. ✅ Provided their contact information (Step 2: Clinic name, name, email, WhatsApp)
3. ✅ Viewed their diagnostic results (Step 3: Lost revenue calculation)

---

## 📋 **WHICH TABLE STORES LEADS?**

Leads are stored in **TWO TABLES** depending on the stage:

### **1. `leads` Table** - For Analytics Tracking

**Location**: Supabase database  
**Created by**: `supabase/migrations/003_analytics_tracking.sql`

**Purpose**: Track lead form progress and abandonment for analytics

**Schema:**
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  session_id TEXT NOT NULL,
  clinic_name TEXT,
  name TEXT,
  email TEXT,
  whatsapp TEXT,
  total_patients INTEGER,
  ticket_medio NUMERIC(10,2),
  inactive_percent INTEGER,
  lost_revenue NUMERIC(10,2),
  status TEXT DEFAULT 'completed',  -- 'started', 'step1', 'step2', 'completed', 'abandoned'
  abandoned_at_step INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

**When data is added:**
- **Step 1 started**: Creates entry with `status = 'started'`
- **Step 1 completed**: Updates with patient data, `status = 'step1'`
- **Step 2 completed**: Updates with contact info, `status = 'step2'`
- **Step 3 completed**: Updates with `status = 'completed'`, `completed_at = NOW()`

**Purpose:**
- Track conversion funnel
- Identify where users abandon the form
- Measure completion rate
- Analytics for admin dashboard

---

### **2. `clinics` Table** - For User Accounts (NOT CURRENTLY USED)

**Location**: Supabase database  
**Created by**: `supabase/migrations/001_initial_schema.sql`

**Schema:**
```sql
CREATE TABLE clinics (
  id UUID PRIMARY KEY,
  license_key TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  clinic_name TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('FREE', 'PRO', 'PREMIUM')),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Current Status**: ⚠️ **NOT USED FOR LEAD CAPTURE**

**Design Purpose:**
- Originally designed for desktop app users
- Created when user verifies license key
- Tracks subscription tier and license

**🚨 IMPORTANT**: Your current landing page does NOT create entries in the `clinics` table!

---

## 🔄 **COMPLETE LEAD SUBMISSION FLOW**

### **Step-by-Step Process:**

#### **1. User Lands on Homepage** (`app/page.tsx`)
- Form displays with 3 steps
- Client-side tracking starts
- Session ID generated

#### **2. User Completes Step 1** (Business Data)
**Data collected:**
- `totalPatients` - Total number of patients
- `ticketMedio` - Average ticket value (R$)
- `inactivePercent` - % of inactive patients (10-90%)
- `lostRevenue` - Calculated potential revenue loss

**What happens:**
```typescript
// lib/analytics.ts - trackLeadStep1()
fetch('/api/analytics/track', {
  method: 'POST',
  body: JSON.stringify({
    eventType: 'lead_step1',
    sessionId: 'xxx',
    data: { totalPatients, ticketMedio, inactivePercent, lostRevenue }
  })
});
```

**Result:**
- Row created/updated in `leads` table
- `status = 'step1'`
- Business data saved

---

#### **3. User Completes Step 2** (Contact Information)
**Data collected:**
- `clinicName` - Name of the clinic
- `name` - Person's full name
- `email` - Email address
- `whatsapp` - WhatsApp phone number (with +55 prefix)

**What happens:**
```typescript
// lib/analytics.ts - trackLeadStep2()
fetch('/api/analytics/track', {
  method: 'POST',
  body: JSON.stringify({
    eventType: 'lead_step2',
    sessionId: 'xxx',
    data: { clinicName, name, email, whatsapp }
  })
});
```

**Result:**
- Row updated in `leads` table
- `status = 'step2'`
- Contact info added

---

#### **4. User Reaches Step 3** (Results Display)
**What happens:**

**A) Submit to Make.com Webhook** (if configured)
```typescript
// app/api/submit-diagnostic/route.ts
fetch(process.env.MAKE_WEBHOOK_URL, {
  method: 'POST',
  body: JSON.stringify({
    ...allFormData,
    timestamp: new Date().toISOString()
  })
});
```

**B) Track Lead Completion**
```typescript
// lib/analytics.ts - trackLeadCompleted()
fetch('/api/analytics/track', {
  method: 'POST',
  body: JSON.stringify({
    eventType: 'lead_completed',
    sessionId: 'xxx',
    data: { ...allFormData }
  })
});
```

**C) Send to Facebook CAPI** (Conversion Event)
```typescript
// lib/analytics.ts - trackLeadCompleted()
fetch('/api/facebook/capi', {
  method: 'POST',
  body: JSON.stringify({
    eventName: 'Lead',
    userData: {
      email: data.email,
      phone: data.whatsapp,
      firstName: data.name.split(' ')[0]
    }
  })
});
```

**Result:**
- Row updated in `leads` table
- `status = 'completed'`
- `completed_at = NOW()`
- Facebook Pixel fires "Lead" event
- Facebook CAPI receives "Lead" event (server-side)
- Make.com webhook receives full data (if configured)

---

## 📊 **DATA FLOW DIAGRAM**

```
Landing Page (/)
       ↓
Step 1: Business Data
       ↓
  [leads table] ← status='step1'
       ↓
Step 2: Contact Info
       ↓
  [leads table] ← status='step2'
       ↓
Step 3: Results
       ↓
  [leads table] ← status='completed'
       ↓
       ├─→ Make.com Webhook (external automation)
       ├─→ Facebook Pixel (browser-side tracking)
       └─→ Facebook CAPI (server-side tracking)
```

---

## 🎯 **WHAT CONSTITUTES A "COMPLETED LEAD"?**

A lead is considered **COMPLETED** when:

1. ✅ User fills out ALL fields in Steps 1 & 2
2. ✅ User reaches Step 3 (results page)
3. ✅ API call to `/api/analytics/track` with `eventType='lead_completed'` succeeds
4. ✅ Row in `leads` table has `status='completed'`
5. ✅ Row in `leads` table has `completed_at` timestamp set

---

## 📈 **HOW TO VIEW LEADS IN SUPABASE**

### **Query 1: All Completed Leads**
```sql
SELECT 
  clinic_name,
  name,
  email,
  whatsapp,
  total_patients,
  ticket_medio,
  inactive_percent,
  lost_revenue,
  created_at,
  completed_at
FROM leads
WHERE status = 'completed'
ORDER BY completed_at DESC;
```

### **Query 2: Lead Conversion Funnel**
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM leads
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'started' THEN 1
    WHEN 'step1' THEN 2
    WHEN 'step2' THEN 3
    WHEN 'completed' THEN 4
    ELSE 5
  END;
```

**Expected Output:**
```
status      | count | percentage
------------|-------|------------
started     |   100 |   40.00%
step1       |    80 |   32.00%
step2       |    60 |   24.00%
completed   |    50 |   20.00%
```

### **Query 3: Recent Leads (Last 24 Hours)**
```sql
SELECT 
  clinic_name,
  name,
  email,
  whatsapp,
  lost_revenue,
  completed_at
FROM leads
WHERE status = 'completed'
  AND completed_at >= NOW() - INTERVAL '24 hours'
ORDER BY completed_at DESC;
```

### **Query 4: High-Value Leads (Lost Revenue > R$ 10,000)**
```sql
SELECT 
  clinic_name,
  name,
  email,
  whatsapp,
  total_patients,
  lost_revenue,
  completed_at
FROM leads
WHERE status = 'completed'
  AND lost_revenue > 10000
ORDER BY lost_revenue DESC;
```

---

## 🔍 **ADMIN DASHBOARD ANALYTICS**

The admin dashboard (`/admin/dashboard`) queries the `leads` table to show:

### **Metrics Displayed:**
- **Total Leads**: `COUNT(*)` where `status='completed'`
- **Leads Today**: `COUNT(*)` where `completed_at >= TODAY()`
- **Conversion Rate**: `completed / started * 100`
- **Average Lost Revenue**: `AVG(lost_revenue)`
- **Recent Leads**: Last 10-20 completed leads

**API Endpoint**: `app/api/admin/analytics/route.ts`

**Query Used:**
```typescript
// Get total leads count
const { count: totalLeads } = await supabaseAdmin
  .from('leads')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'completed');

// Get recent leads
const { data: recentLeads } = await supabaseAdmin
  .from('leads')
  .select('*')
  .eq('status', 'completed')
  .order('completed_at', { ascending: false })
  .limit(20);
```

---

## 🚨 **IMPORTANT: CLINICS TABLE NOT USED**

### **Current Behavior:**
❌ Lead submission does NOT create a row in `clinics` table  
❌ Lead submission does NOT create a license key  
❌ Lead submission does NOT create a user account  

### **What Creates a Clinic Entry:**
✅ **Desktop app license verification** (`/api/auth/verify-license`)  
✅ **Manual user creation** via admin interface (if implemented)  
✅ **Payment webhook** from Mercado Pago (creates subscription)  

---

## 💡 **RECOMMENDED: CONNECT LEADS TO CLINICS**

### **Option 1: Create Clinic on Lead Submission**

When a lead is completed, automatically create a FREE tier clinic:

```typescript
// In app/api/analytics/track/route.ts
case 'lead_completed':
  // Save to leads table (existing)
  await supabaseAdmin.from('leads').upsert({
    session_id: sessionId,
    ...data,
    status: 'completed',
    completed_at: new Date().toISOString()
  });

  // NEW: Create clinic entry with FREE tier
  const licenseKey = generateLicenseKey(); // e.g., uuid or custom format
  await supabaseAdmin.from('clinics').insert({
    license_key: licenseKey,
    email: data.email,
    clinic_name: data.clinicName,
    tier: 'FREE'
  });

  // Send license key to user via email
  break;
```

**Benefits:**
- ✅ User gets license key immediately
- ✅ Can download and activate desktop app
- ✅ Starts with FREE tier (10 messages/day)
- ✅ Can upgrade to PRO/PREMIUM later

---

### **Option 2: Create Clinic When User Downloads App**

Track app downloads in `downloads` table, then create clinic:

```typescript
// In download tracking
if (planType === 'free') {
  const licenseKey = generateLicenseKey();
  await supabaseAdmin.from('clinics').insert({
    license_key: licenseKey,
    email: email,
    tier: 'FREE'
  });
  
  // Return license key to user
}
```

**Benefits:**
- ✅ Only creates account for users who actually download
- ✅ Reduces unused accounts
- ✅ Better conversion tracking

---

## 📊 **CURRENT TABLES SUMMARY**

| Table | Purpose | Lead Submission Creates Row? |
|-------|---------|------------------------------|
| `leads` | Analytics tracking | ✅ YES - On completion |
| `clinics` | User accounts | ❌ NO - Manual/Desktop app only |
| `subscriptions` | Payment tracking | ❌ NO - Webhook only |
| `downloads` | App download tracking | ✅ YES - If implemented |
| `page_views` | Page analytics | ✅ YES - On page load |
| `conversion_events` | Facebook events | ✅ YES - On lead completion |

---

## ✅ **VERIFICATION CHECKLIST**

To verify lead submission is working:

- [ ] Open Supabase SQL Editor
- [ ] Run: `SELECT * FROM leads WHERE status='completed' ORDER BY completed_at DESC LIMIT 10;`
- [ ] Should see completed leads with:
  - ✅ `clinic_name` filled
  - ✅ `name` filled
  - ✅ `email` filled
  - ✅ `whatsapp` filled
  - ✅ `total_patients` filled
  - ✅ `lost_revenue` calculated
  - ✅ `completed_at` timestamp
  - ✅ `status = 'completed'`

If no rows appear:
- ❌ No one has completed the form yet
- ❌ Database migration not run
- ❌ API tracking calls failing

---

## 🎯 **ANSWER TO YOUR QUESTIONS**

### **Q: What table should contain the leads when we submit a lead?**

**A: The `leads` table** (from `003_analytics_tracking.sql` migration)

This is where ALL lead form submissions are stored for analytics.

---

### **Q: What is the definition of lead submission?**

**A: A lead submission is when a visitor:**
1. Completes Step 1 (business data)
2. Completes Step 2 (contact information)
3. Reaches Step 3 (results page)
4. System creates/updates row in `leads` table with `status='completed'`
5. Facebook Pixel fires "Lead" event
6. Facebook CAPI receives "Lead" event (server-side)
7. Make.com webhook receives data (if configured)

**Key indicator**: Row in `leads` table with `status='completed'` and `completed_at` timestamp.

---

## 🔧 **RECOMMENDED NEXT STEPS**

1. **Verify migration 003 is run:**
   ```sql
   SELECT * FROM leads LIMIT 1;
   ```
   If error "relation does not exist", run the migration.

2. **Check for existing leads:**
   ```sql
   SELECT COUNT(*), status FROM leads GROUP BY status;
   ```

3. **Monitor lead flow in real-time:**
   - Watch Supabase table viewer
   - Submit test lead on landing page
   - Verify row appears with `status='completed'`

4. **Connect leads to clinics** (optional but recommended):
   - Implement Option 1 or Option 2 above
   - Automatically create FREE tier accounts
   - Email license keys to new users

---

## 📞 **NEED HELP?**

If leads are not appearing in the `leads` table:
1. Check Vercel logs for errors in `/api/analytics/track`
2. Check browser console for failed API calls
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
4. Run database migration `003_analytics_tracking.sql`

**Your leads are in the `leads` table!** 🎉
