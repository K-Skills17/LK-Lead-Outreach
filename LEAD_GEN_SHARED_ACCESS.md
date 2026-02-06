# Lead Gen Tool – Shared Database Access

When leads in the Outreach Tool show **"no matching data"** for enrichment, audits, or GPB scores, it usually means one of two things:

1. **The Outreach Tool does not have read access** to the Lead Gen database, or  
2. **Leads in the Outreach Tool are not linked** to Lead Gen (missing `lead_gen_id`).

This doc explains how to **grant shared access** and how to **check** that it works.

---

## 1. What the Outreach Tool needs

The Outreach Tool reads from the **Lead Gen Engine’s Supabase project** (separate from the Outreach Tool’s own Supabase):

| Item | Value |
|------|--------|
| **Lead Gen Supabase URL** | `https://dktijniwjcmwyaliocen.supabase.co` |
| **Schema** | `public` |
| **Required env in Outreach Tool** | `LEAD_GEN_SUPABASE_SERVICE_ROLE_KEY` |

The Outreach Tool expects these **tables** in the Lead Gen project (all in `public`):

- `leads` – core lead data  
- `enrichment` – email validation, contact name, phones, has_contact_page, has_booking_system, marketing_tags  
- `audits` – rating, review_count, gpb_completeness_score, audit_results (JSONB)  
- `analysis` – pain points, AI intro/CTA, etc.  
- `campaigns`, `reports`, `competitor_analysis`, `lead_quality_scores`, `outreach`, `whatsapp_outreach`, `lead_responses`, `conversions`, `calendar_bookings`, `lead_outreach_sync`, `analysis_landing_pages`

So: **shared access** = the Outreach Tool can **read** these tables using the Lead Gen project’s **service_role** key.

---

## 2. How to grant shared access (Lead Gen team)

1. Open the **Lead Gen** Supabase project:  
   [Supabase Dashboard → project `dktijniwjcmwyaliocen`](https://supabase.com/dashboard/project/dktijniwjcmwyaliocen/settings/api).

2. Go to **Settings → API**.

3. Under **Project API keys**, copy the **`service_role`** key (secret; bypasses RLS).

4. Share that key **only** with the person who configures the **Outreach Tool** (e.g. via a secure channel).  
   Do **not** commit it to git or expose it in the frontend.

5. The Outreach Tool admin sets it in the environment (see below).

**Important:**  
- The key must be from the **same** Lead Gen Supabase project the Outreach Tool is configured for (`dktijniwjcmwyaliocen`).  
- If the Lead Gen app uses a **different** Supabase project, then the Outreach Tool’s `LEAD_GEN_SUPABASE_URL` (and possibly project ref) would need to be updated in code to point at that project; the key would then be that project’s `service_role` key.

---

## 3. How to configure the Outreach Tool

In the environment where the Outreach Tool runs (e.g. Vercel, or local `.env.local`), set:

```bash
LEAD_GEN_SUPABASE_SERVICE_ROLE_KEY=<paste the service_role key from Lead Gen Supabase>
```

- **Local:** put this in `.env.local`.  
- **Vercel:** Project → Settings → Environment Variables → add `LEAD_GEN_SUPABASE_SERVICE_ROLE_KEY`.

Then restart or redeploy the Outreach Tool so it picks up the new variable.

---

## 4. How to check that shared access works

Use one of these endpoints to see if the Outreach Tool can **see** the Lead Gen DB and its tables.

### Option A – Admin (no integration token)

If you have the **Admin dashboard token**:

```bash
curl -s -H "Authorization: Bearer YOUR_ADMIN_DASHBOARD_TOKEN" \
  "https://YOUR_OUTREACH_APP_URL/api/admin/lead-gen-db-access"
```

Response includes:

- `configured` – whether `LEAD_GEN_SUPABASE_SERVICE_ROLE_KEY` is set  
- `connection.success` – whether we can connect to Lead Gen Supabase  
- `tables` – for each table: `accessible` and `count` (or `error`)

If `connection.success` is `true` and key tables (`leads`, `enrichment`, `audits`) show `accessible: true` and a `count`, shared access is working.

### Option B – Integration token

If you use the integration token (e.g. for scripts or Lead Gen app):

```bash
curl -s -H "Authorization: Bearer YOUR_LEAD_GEN_INTEGRATION_TOKEN" \
  "https://YOUR_OUTREACH_APP_URL/api/integration/lead-gen-db/tables"
```

Same idea: check `connection.success` and `tables[].accessible` / `count`.

### Option C – Full integration test

```bash
curl -s -H "Authorization: Bearer YOUR_LEAD_GEN_INTEGRATION_TOKEN" \
  "https://YOUR_OUTREACH_APP_URL/api/integration/lead-gen-db/test"
```

This checks connection and returns sample data (e.g. campaigns). If this works, the Outreach Tool has shared access to the Lead Gen DB.

---

## 5. Why “no matching data” can still appear

Even with **shared access** and tables readable, a lead in the Outreach Tool can show “no matching data” if:

- **`lead_gen_id` is null**  
  The Outreach Tool looks up data by **Lead Gen lead ID** (`lead_gen_id` on `campaign_contacts`). If the contact was created from CSV or another source and never got a `lead_gen_id`, we have nothing to look up in the Lead Gen DB.

**What to do:**

1. **For new leads**  
   Send them through the **Lead Gen → Outreach** integration (e.g. POST to `/api/integration/leads/receive`) so that `lead_gen_id` is set when the contact is created/updated.

2. **For existing leads**  
   - Use **Admin → Leads → “Sync from Lead Gen DB”** for selected contacts. The sync tries to match by `lead_gen_id` or by **phone** in the Lead Gen `leads` table; if a match is found, it pulls enrichment/audits and updates the contact.  
   - If many contacts don’t have `lead_gen_id`, you may need a one-off script or process that sets `lead_gen_id` from your Lead Gen DB (e.g. by matching phone or email), then run “Sync from Lead Gen DB” again.

---

## 6. Summary checklist

- [ ] Lead Gen Supabase project exposes `public.leads`, `public.enrichment`, `public.audits`, etc.  
- [ ] Outreach Tool has `LEAD_GEN_SUPABASE_SERVICE_ROLE_KEY` set (service_role key from that project).  
- [ ] `GET /api/admin/lead-gen-db-access` or `GET /api/integration/lead-gen-db/tables` shows `connection.success` and tables accessible.  
- [ ] Contacts that should show data have `lead_gen_id` set (via integration or Sync from Lead Gen DB).

If all of the above are true and a lead still has no matching data, the next step is to check that the Lead Gen DB actually has a row for that lead (same `id` as `lead_gen_id`) and that `enrichment` / `audits` rows exist for that `lead_id`.
