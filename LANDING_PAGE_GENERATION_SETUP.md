# 🎨 Landing Page Generation Setup

## ✅ Implementation Complete

Your Outreach Tool now supports generating sample landing page mockups for leads based on their website performance. This feature is available for **ALL leads** (not qualification-based) and helps show prospects what we can build for them.

---

## 🎯 How It Works

### Generation Criteria

Landing pages are generated for leads that meet **ANY** of these criteria:

1. **Poor SEO Performance**: SEO score < 70
2. **Poor Page Performance**: Page score < 70
3. **No Website**: Lead has no website URL

**Key Difference from Analysis Images:**
- **Analysis Images**: Only for VIP/HOT/WARM leads with pain points (qualification-based)
- **Landing Pages**: For ALL leads with poor website performance (performance-based)

### Generation Flow

1. **Admin clicks "Landing Page" button** on a lead
2. **System checks website performance:**
   - SEO score < 70 OR
   - Page score < 70 OR
   - No website
3. **OpenAI generates personalized prompt** for landing page mockup
4. **Leonardo AI generates landing page** (1920x1080, takes 10-30 seconds)
5. **Landing page URL saved** to `campaign_contacts.landing_page_url`
6. **Landing page automatically included** in emails when sent

---

## 🔧 Required Environment Variables

Same as Leonardo AI setup:

```env
# Leonardo AI Configuration
LEONARDO_API_KEY=your_leonardo_api_key_here
LEONARDO_API_URL=https://cloud.leonardo.ai/api/rest/v1  # Optional (default)
LEONARDO_MODEL_ID=6bef9f1b-29eb-4322-9e0c-66c551b158c1  # Optional (default)

# OpenAI API Key (Required for prompt generation)
OPENAI_API_KEY=sk-proj-your_key_here  # Already configured
```

**Note:** Uses the same Leonardo AI API key as analysis images.

---

## 📧 Email Integration

### Automatic Landing Page Inclusion

When sending emails, the system **automatically includes** the landing page if available:

1. **Priority Order:**
   - Analysis Image (if available)
   - Landing Page (if available)
   - Report URL (fallback)

2. **Landing Page Display:**
   - Shows in email with orange-themed styling
   - Includes "Ver Landing Page Completa" button
   - Professional preview image

### Email Template Example

The system automatically adds this HTML to your email content:

```html
<div style="text-align: center; margin: 30px 0; padding: 20px; background: #fff7ed; border-radius: 8px; border: 2px solid #fb923c;">
  <h3 style="color: #1e293b; margin-bottom: 15px; font-size: 18px;">🎨 Página de Destino Personalizada</h3>
  <p style="color: #64748b; margin-bottom: 15px; font-size: 14px;">
    Criamos uma prévia de como seria uma landing page otimizada para {empresa}
  </p>
  <img src="{landing_page_url}" 
       alt="Landing Page Mockup - {empresa}" 
       style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
  <div style="margin-top: 15px;">
    <a href="{landing_page_url}" 
       style="display: inline-block; padding: 12px 24px; background: #fb923c; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
      Ver Landing Page Completa
    </a>
  </div>
</div>
```

---

## 🎨 Admin Dashboard Features

### Generate Landing Page Button

- **Location**: Leads table → Actions column
- **Button**: Orange "Landing Page" button with building icon
- **Function**: Generates landing page mockup for the lead
- **Status**: Shows "Generating..." while processing

### When Button is Available

- **Available for ALL leads** (not just VIP/HOT/WARM)
- **Automatically checks** if lead needs landing page based on performance
- **Can force generation** using API with `force: true`

---

## 🔌 API Endpoints

### Generate Landing Page

**POST** `/api/admin/leads/generate-landing-page`

**Request:**
```json
{
  "contactId": "uuid-here",
  "force": false  // Optional: force generation even if performance is good
}
```

**Response:**
```json
{
  "success": true,
  "landingPageUrl": "https://cdn.leonardo.ai/generations/...",
  "generationId": "abc123-def456",
  "message": "Landing page generated successfully"
}
```

### Check if Lead Needs Landing Page

**GET** `/api/admin/leads/generate-landing-page?contactId=uuid-here`

**Response:**
```json
{
  "needsLandingPage": true,
  "hasLandingPage": false,
  "landingPageUrl": null,
  "seoScore": 45,
  "pageScore": 52,
  "hasWebsite": true
}
```

---

## 📊 Landing Page Characteristics

- **Size**: 1920x1080 pixels (standard landing page aspect ratio)
- **Format**: PNG or JPG (hosted on Leonardo AI CDN)
- **Style**: Professional landing page mockup
- **Content**: Personalized based on lead's business and performance issues
- **Generation Time**: 10-30 seconds (asynchronous)

### What's Included in Landing Pages

Based on available lead data, landing pages typically include:

1. **Hero Section**
   - Company name prominently displayed
   - Compelling headline
   - Clear call-to-action buttons

2. **Key Features/Benefits**
   - Visual representation of value propositions
   - Industry-specific benefits

3. **Conversion Elements**
   - Multiple CTA buttons (e.g., "Get Started", "Contact Us")
   - Social proof section (if applicable)
   - Trust indicators

4. **Design Elements**
   - Modern, clean design
   - Industry-appropriate color scheme
   - Mobile-responsive preview
   - Professional layout

5. **Performance Focus**
   - Highlights what a high-performing landing page would look like
   - Addresses current website performance issues

---

## 🆚 Comparison: Analysis Images vs Landing Pages

| Feature | Analysis Images | Landing Pages |
|---------|----------------|---------------|
| **Purpose** | Show business analysis & metrics | Show what we can build |
| **Qualification** | VIP/HOT/WARM + pain points | Based on website performance |
| **Available For** | Qualified leads only | ALL leads |
| **Criteria** | Quality tier + pain points | SEO <70 OR Page <70 OR no website |
| **Size** | 1024x1024 (square) | 1920x1080 (landscape) |
| **Use Case** | Demonstrate analysis value | Demonstrate build capability |

---

## 🚨 Troubleshooting

### "LEONARDO_API_KEY not configured"

**Solution:**
- Same as analysis images - uses the same API key
- Get key from Leonardo AI dashboard
- Add to `.env.local` and Vercel

### "Lead does not need a landing page"

**Solution:**
- This means website performance is good (SEO ≥70, Page ≥70)
- Use `force: true` parameter to generate anyway
- Or wait until performance scores drop

### "Landing page generation timed out"

**Solution:**
- Normal - generation takes 10-30 seconds
- Check Leonardo AI service status
- Verify API key is valid
- Try again (may be temporary issue)

### Landing pages not appearing in emails

**Solution:**
1. Verify `landing_page_url` is saved in database
2. Check email HTML includes landing page
3. Some email clients block images - recipient must allow images
4. Verify landing page URL is accessible (check in browser)

---

## 💡 Best Practices

1. **Generate Based on Performance**: Only generate when website performance is poor (automatic check)
2. **Use for All Leads**: Unlike analysis images, landing pages are for ALL leads
3. **Show Value**: Landing pages demonstrate what we can build, not just analyze
4. **Combine with Analysis**: Can send both analysis image AND landing page in same email
5. **Monitor Costs**: Track Leonardo AI and OpenAI API usage

---

## 📋 Implementation Checklist

- [ ] Leonardo AI API key configured (same as analysis images)
- [ ] OpenAI API key configured (already done)
- [ ] Test landing page generation from admin dashboard
- [ ] Verify landing page appears in email
- [ ] Check landing page displays correctly
- [ ] Test with leads that have poor website performance
- [ ] Test with leads that have no website

---

## ✅ Summary

**What's Implemented:**
- ✅ Landing page service for generating mockups
- ✅ API endpoint to generate landing pages
- ✅ Automatic inclusion in emails
- ✅ Admin dashboard "Landing Page" button
- ✅ Performance-based generation (not qualification-based)
- ✅ Available for ALL leads
- ✅ Force generation option

**What You Need:**
- 🔑 Leonardo AI API key (same as analysis images)
- 🔑 OpenAI API key (already configured)

**Key Features:**
- 🎯 **Performance-Based**: Generates for leads with poor website performance
- 🌐 **All Leads**: Available for ALL leads (not just qualified ones)
- 📧 **Auto-Include**: Automatically added to emails
- 🎨 **Professional**: High-quality mockups showing what we can build

---

**Last Updated**: 2026-02-01  
**Status**: ✅ Complete Implementation
