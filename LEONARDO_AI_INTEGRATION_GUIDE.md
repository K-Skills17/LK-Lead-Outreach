# 📤 Leonardo AI Analysis Image Integration Guide

## ✅ Implementation Complete

Your Outreach Tool has been updated to support Leonardo AI analysis images. The system now accepts and displays high-fidelity analysis images instead of HTML landing pages.

---

## 🎯 What Changed

### Database Schema
- ✅ Added `analysis_image_url` column to `campaign_contacts` table
- ✅ Added index for quick lookups
- ✅ Kept `landing_page_url` for backward compatibility (deprecated)

### API Endpoint
- ✅ Updated `/api/integration/leads/receive` to accept `analysis_image_url`
- ✅ Stores `analysis_image_url` in database
- ✅ Falls back to `landing_page_url` if `analysis_image_url` is not provided (backward compatibility)

### Admin Dashboard
- ✅ Added analysis image display in lead detail modal
- ✅ Added image preview with download and copy link functionality
- ✅ Added "Análise" column in leads table showing image availability
- ✅ Shows indicator badge for leads with analysis images

---

## 📊 Database Migration

Run the migration to add the new column:

```sql
-- Run this migration
-- File: supabase/migrations/013_leonardo_ai_images.sql

-- Add new analysis_image_url column
ALTER TABLE campaign_contacts 
ADD COLUMN IF NOT EXISTS analysis_image_url TEXT NULL;

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_analysis_image_url 
ON campaign_contacts(analysis_image_url) 
WHERE analysis_image_url IS NOT NULL;

-- Optional: Add generation ID tracking
ALTER TABLE campaign_contacts 
ADD COLUMN IF NOT EXISTS analysis_image_generation_id TEXT NULL;
```

**To run the migration:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the migration SQL
4. Run it

---

## 🔌 API Endpoint

### Request Format

Your Lead Gen App should send:

```json
{
  "nome": "Dr. John Smith",
  "empresa": "Smith Dental Clinic",
  "phone": "+15551234567",
  "email": "info@smithdental.com",
  "analysis_image_url": "https://cdn.leonardo.ai/generations/abc123-def456-ghi789.png",
  "report_url": "https://drive.google.com/file/d/...",
  "enrichment_data": { /* ... */ }
}
```

### Response Format

```json
{
  "success": true,
  "created": 1,
  "updated": 0,
  "errors": [],
  "skipped": 0
}
```

### Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `analysis_image_url` | `string \| null` | ❌ No | URL to Leonardo AI analysis image |
| `report_url` | `string \| null` | ❌ No | Fallback report URL |

**Notes:**
- `analysis_image_url` can be `null` if image generation failed or lead doesn't qualify
- System will use `landing_page_url` as fallback if `analysis_image_url` is not provided (backward compatibility)
- Both fields are stored in the database

---

## 🎨 Admin Dashboard Features

### Lead Detail Modal

When viewing a lead, you'll see:

1. **Analysis Image Section** (if image exists):
   - Full-size image preview
   - "Ver Imagem Completa" button (opens in new tab)
   - "Download" button
   - "Copiar Link" button (copies URL to clipboard)
   - "Ver Relatório Completo" button (if report_url exists)

2. **Image Display**:
   - Responsive image container
   - Max height: 384px (auto-scales)
   - Error handling (shows fallback if image fails to load)

### Leads Table

New "Análise" column shows:
- 📊 **"Disponível"** badge (green) - Lead has analysis image
- **"-"** (gray) - No analysis image available

---

## 📧 Email Integration

### Using Analysis Images in Emails

When sending emails via the admin dashboard, you can include the analysis image:

**HTML Template Example:**

```html
<!DOCTYPE html>
<html>
<body>
  <h1>Olá {{nome}}!</h1>
  
  <p>Analisamos sua empresa <strong>{{empresa}}</strong> e criamos uma análise visual personalizada.</p>
  
  {{#if analysis_image_url}}
  <div style="text-align: center; margin: 20px 0;">
    <img src="{{analysis_image_url}}" 
         alt="Análise Digital - {{empresa}}" 
         style="max-width: 100%; height: auto; border-radius: 8px;" />
  </div>
  
  <p style="text-align: center;">
    <a href="{{analysis_image_url}}" 
       style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">
      Ver Análise Completa
    </a>
  </p>
  {{else}}
  <p>
    <a href="{{report_url}}">Veja o relatório completo</a>
  </p>
  {{/if}}
  
  <p>Estamos prontos para ajudar você a melhorar sua presença digital!</p>
</body>
</html>
```

**To use in admin email modal:**
1. Click "Email" button on a lead
2. In the email content, include:
   ```html
   {% if lead.analysis_image_url %}
   <img src="{{lead.analysis_image_url}}" alt="Análise" style="max-width: 100%;" />
   {% endif %}
   ```

---

## 💬 WhatsApp Integration

### Sending Analysis Images via WhatsApp

The desktop WhatsApp sender app can access analysis images via the queue API:

**API Endpoint:** `GET /api/sender/queue`

**Response includes:**
```json
{
  "contacts": [
    {
      "id": "...",
      "nome": "Dr. John Smith",
      "empresa": "Smith Dental Clinic",
      "analysis_image_url": "https://cdn.leonardo.ai/generations/...",
      "report_url": "https://...",
      // ... other fields
    }
  ]
}
```

**WhatsApp Message Template:**
```
Oi {{nome}}! 👋

Criamos uma análise visual personalizada da {{empresa}}.

{{#if analysis_image_url}}
📊 Veja a análise: {{analysis_image_url}}
{{else}}
📄 Veja o relatório: {{report_url}}
{{/if}}

Quer saber mais? Responda esta mensagem!
```

**To send image in WhatsApp:**
1. Desktop app fetches lead from queue
2. Checks if `analysis_image_url` exists
3. Sends image with caption using WhatsApp API
4. Falls back to text message with report URL if no image

---

## 🔍 Filtering & Search

### Filter Leads by Analysis Image Status

**SQL Query:**
```sql
-- Leads WITH analysis images
SELECT * FROM campaign_contacts 
WHERE analysis_image_url IS NOT NULL;

-- Leads WITHOUT analysis images
SELECT * FROM campaign_contacts 
WHERE analysis_image_url IS NULL;

-- Count statistics
SELECT 
  COUNT(*) as total_leads,
  COUNT(analysis_image_url) as leads_with_images,
  ROUND(100.0 * COUNT(analysis_image_url) / COUNT(*), 2) as image_generation_rate
FROM campaign_contacts
WHERE created_at >= NOW() - INTERVAL '30 days';
```

**In Admin Dashboard:**
- Currently shows indicator in "Análise" column
- Future enhancement: Add filter dropdown to filter by image status

---

## 📋 Complete Field Mapping

### Fields Accepted by API:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nome` | string | ✅ Yes | Lead name |
| `empresa` | string | ✅ Yes | Company name |
| `phone` | string | ✅ Yes | Phone in E.164 format |
| `email` | string | ❌ No | Email (can be null) |
| **`analysis_image_url`** | **string** | **❌ No** | **⭐ NEW - Analysis image URL** |
| `report_url` | string | ❌ No | Report URL (fallback) |
| `landing_page_url` | string | ❌ No | **Deprecated** - kept for backward compatibility |
| `enrichment_data` | object | ❌ No | Full enrichment data (JSONB) |

### Fields Stored in Database:

- `campaign_contacts.analysis_image_url` - Primary field for Leonardo AI images
- `campaign_contacts.report_url` - Fallback report URL
- `campaign_contacts.enrichment_data.analysis_image_url` - Also stored in JSONB for redundancy

---

## ✅ Testing Checklist

### Database:
- [ ] Run migration `013_leonardo_ai_images.sql`
- [ ] Verify `analysis_image_url` column exists
- [ ] Verify index was created

### API Endpoint:
- [ ] Test receiving lead WITH `analysis_image_url`
- [ ] Test receiving lead WITHOUT `analysis_image_url` (null)
- [ ] Test receiving lead with `landing_page_url` (backward compatibility)
- [ ] Verify image URL is stored correctly

### Admin Dashboard:
- [ ] View lead WITH analysis image - verify image displays
- [ ] View lead WITHOUT analysis image - verify no error
- [ ] Test "Ver Imagem Completa" button
- [ ] Test "Download" button
- [ ] Test "Copiar Link" button
- [ ] Verify "Análise" column shows correct status

### Email:
- [ ] Send email with analysis image URL in content
- [ ] Verify image displays in email client
- [ ] Test fallback to report URL if no image

### WhatsApp:
- [ ] Verify queue API returns `analysis_image_url`
- [ ] Test sending image via WhatsApp
- [ ] Test fallback to text message if no image

---

## 🚨 Important Notes

### 1. **Analysis Image URL Can Be Null**
- Not all leads get analysis images (only quality leads with pain points)
- Always check if `analysis_image_url` exists before using it
- Have fallback to `report_url` if image doesn't exist

### 2. **Image URLs Are Direct Links**
- Images are hosted on Leonardo AI CDN
- URLs are permanent and can be shared directly
- Images are optimized for web (typically PNG or JPG)
- No authentication required to view images

### 3. **Image Format**
- Images are typically **1024x1024 pixels** (square format)
- Perfect for sharing in emails and WhatsApp
- Professional infographic style
- Includes business name, metrics, and key insights

### 4. **Backward Compatibility**
- Old `landing_page_url` field is still accepted (deprecated)
- System will use `analysis_image_url` if provided, otherwise falls back to `landing_page_url`
- Both fields can coexist during migration period

### 5. **Performance**
- Images are generated asynchronously by Lead Gen App
- May take 10-30 seconds to generate
- If image generation fails, lead is still sent (without image)
- System continues to work even if Leonardo AI is unavailable

---

## 📊 Example Payloads

### Lead WITH Analysis Image:

```json
{
  "nome": "Dr. John Smith",
  "empresa": "Smith Dental Clinic",
  "phone": "+15551234567",
  "email": "info@smithdental.com",
  "analysis_image_url": "https://cdn.leonardo.ai/generations/abc123-def456-ghi789.png",
  "report_url": "https://drive.google.com/file/d/...",
  "enrichment_data": {
    "rating": 4.5,
    "reviews": 120,
    "rank": 8
  }
}
```

### Lead WITHOUT Analysis Image:

```json
{
  "nome": "Dr. John Smith",
  "empresa": "Smith Dental Clinic",
  "phone": "+15551234567",
  "email": "info@smithdental.com",
  "analysis_image_url": null,
  "report_url": "https://drive.google.com/file/d/...",
  "enrichment_data": { /* ... */ }
}
```

---

## 🔧 Troubleshooting

### Image Not Displaying

**Check:**
1. Verify `analysis_image_url` is stored in database
2. Check image URL is accessible (open in browser)
3. Verify CORS settings on Leonardo AI CDN
4. Check browser console for errors

### Migration Errors

**If migration fails:**
1. Check if column already exists: `SELECT column_name FROM information_schema.columns WHERE table_name = 'campaign_contacts' AND column_name = 'analysis_image_url';`
2. Drop and recreate if needed: `ALTER TABLE campaign_contacts DROP COLUMN IF EXISTS analysis_image_url;`
3. Re-run migration

### API Not Accepting Image URL

**Check:**
1. Verify request includes `analysis_image_url` field
2. Check URL format is valid (starts with `http://` or `https://`)
3. Verify Zod schema accepts the field
4. Check server logs for validation errors

---

## 📞 Support

If you need help:
1. Check server logs for errors
2. Verify database migration ran successfully
3. Test with a single lead first
4. Verify image URLs are being received correctly
5. Check that images display properly in admin dashboard

---

## ✅ Summary

**What Was Implemented:**
- ✅ Database schema updated (`analysis_image_url` column)
- ✅ API endpoint accepts `analysis_image_url`
- ✅ Admin dashboard displays analysis images
- ✅ Image preview, download, and copy link functionality
- ✅ Leads table shows image availability indicator
- ✅ Backward compatibility with `landing_page_url`

**What You Need to Do:**
1. ✅ Run database migration (`013_leonardo_ai_images.sql`)
2. ✅ Update Lead Gen App to send `analysis_image_url`
3. ✅ Test receiving leads with images
4. ✅ Test image display in admin dashboard
5. ✅ Update email/WhatsApp templates to use images (optional)

---

**Last Updated:** 2026-02-01  
**Version:** 1.0  
**Status:** ✅ Ready for Use
