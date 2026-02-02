# 🎨 Leonardo AI Image Generation Setup

## ✅ Implementation Complete

Your Outreach Tool now supports generating personalized visual analysis images using Leonardo AI. These images are perfect for including in emails and WhatsApp messages to grab attention and demonstrate value.

---

## 🔧 Required Environment Variables

Add these to your `.env.local` and Vercel:

```env
# Leonardo AI Configuration
LEONARDO_API_KEY=your_leonardo_api_key_here
LEONARDO_API_URL=https://cloud.leonardo.ai/api/rest/v1  # Optional (default)
LEONARDO_MODEL_ID=6bef9f1b-29eb-4322-9e0c-66c551b158c1  # Optional (default)

# OpenAI API Key (Required for prompt generation)
OPENAI_API_KEY=sk-proj-your_key_here  # Already configured
```

---

## 🔑 How to Get Leonardo AI API Key

1. **Sign up at Leonardo AI**
   - Go to: https://leonardo.ai
   - Create an account (free tier available)

2. **Get API Key**
   - Go to: **API Settings** or **Developer** section
   - Generate a new API key
   - Copy the key (starts with a UUID format)

3. **Add to Environment**
   - Add `LEONARDO_API_KEY` to `.env.local`
   - Add `LEONARDO_API_KEY` to Vercel environment variables
   - Redeploy if on Vercel

---

## 🎯 How It Works

### Image Generation Flow

1. **Admin clicks "Generate Image" button** on a lead
2. **System checks qualification:**
   - Lead must be VIP/HOT/WARM tier OR have good quality score (≥50)
   - Lead must have identified pain points
3. **OpenAI generates personalized prompt** based on lead's data
4. **Leonardo AI generates image** (takes 10-30 seconds)
5. **Image URL saved** to `campaign_contacts.analysis_image_url`
6. **Image automatically included** in emails when sent

### Qualification Criteria

Images are generated for leads that meet:
- **Quality Tier**: VIP, HOT, or WARM (from personalization tier)
- **OR Quality Score**: ≥50 (from business_quality_score)
- **AND Pain Points**: Must have at least one identified pain point

**Note:** You can force generation by using the API with `force: true` parameter.

---

## 📧 Email Integration

### Automatic Image Inclusion

When sending emails, the system **automatically includes** the analysis image if available:

1. **If `analysis_image_url` exists:**
   - Image is embedded in the email HTML
   - Includes "Ver Análise Completa" button
   - Professional styling with centered layout

2. **If no image but `report_url` exists:**
   - Falls back to report URL link
   - Shows "Ver Relatório Completo" button

3. **If neither exists:**
   - Email sends normally without image/report

### Email Template Example

The system automatically adds this HTML to your email content:

```html
<div style="text-align: center; margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 8px;">
  <h3 style="color: #1e293b; margin-bottom: 15px; font-size: 18px;">📊 Análise Visual Personalizada</h3>
  <img src="{analysis_image_url}" 
       alt="Análise Digital - {empresa}" 
       style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
  <div style="margin-top: 15px;">
    <a href="{analysis_image_url}" 
       style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
      Ver Análise Completa
    </a>
  </div>
</div>
```

---

## 💬 WhatsApp Integration

### Image Support

The WhatsApp sending service includes `analysis_image_url` in the contact data. To send images via WhatsApp, you'll need to:

1. **Check if image exists** in the contact data
2. **Use WhatsApp API** to send image with caption
3. **Fallback to text message** if no image

**Example WhatsApp Message:**
```
Olá {nome}! 👋

Criamos uma análise visual personalizada da {empresa}.

📊 Veja a análise: {analysis_image_url}

Quer saber mais? Responda esta mensagem!
```

**Note:** Actual image sending via WhatsApp requires WhatsApp Business API integration.

---

## 🎨 Admin Dashboard Features

### Generate Image Button

- **Location**: Leads table → Actions column
- **Button**: Purple "Image" button with image icon
- **Function**: Generates Leonardo AI image for the lead
- **Status**: Shows "Generating..." while processing

### Image Display

- **Lead Detail Modal**: Shows full-size image preview
- **Leads Table**: "Análise" column shows "Disponível" badge if image exists
- **Download & Copy**: Available in lead detail modal

---

## 🔌 API Endpoints

### Generate Image

**POST** `/api/admin/leads/generate-image`

**Request:**
```json
{
  "contactId": "uuid-here",
  "force": false  // Optional: force generation even if doesn't qualify
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://cdn.leonardo.ai/generations/...",
  "generationId": "abc123-def456",
  "message": "Image generated successfully"
}
```

### Check Qualification

**GET** `/api/admin/leads/generate-image?contactId=uuid-here`

**Response:**
```json
{
  "qualifies": true,
  "hasImage": false,
  "imageUrl": null
}
```

---

## 📊 Image Characteristics

- **Size**: 1024x1024 pixels (square format)
- **Format**: PNG or JPG (hosted on Leonardo AI CDN)
- **Style**: Professional infographic with business metrics
- **Content**: Personalized based on lead's actual data
- **Generation Time**: 10-30 seconds (asynchronous)

### What's Included in Images

Based on available lead data, images typically include:

1. **Business Information**
   - Company name prominently displayed
   - Location (city, state)
   - Website URL

2. **Key Metrics**
   - Google Maps ranking position
   - Google rating (e.g., 4.5/5)
   - Number of reviews
   - Business quality score

3. **Pain Points Visualization**
   - Main identified issues
   - Visual representation of problems
   - Impact indicators

4. **Competitive Insights**
   - Number of competitors identified
   - Competitive positioning
   - Market opportunities

5. **Design Elements**
   - Professional infographic style
   - Charts and graphs
   - Icons and visual elements
   - Modern, clean aesthetic
   - Business-appropriate colors

---

## 🚨 Troubleshooting

### "LEONARDO_API_KEY not configured"

**Solution:**
1. Get API key from Leonardo AI dashboard
2. Add to `.env.local`
3. Add to Vercel environment variables
4. Redeploy

### "Image generation timed out"

**Solution:**
- This is normal - generation takes 10-30 seconds
- Check Leonardo AI service status
- Verify API key is valid
- Try again (may be temporary issue)

### "Lead does not qualify for image generation"

**Solution:**
- Lead must be VIP/HOT/WARM tier OR have quality score ≥50
- Lead must have pain points identified
- Use `force: true` parameter to override qualification

### "OPENAI_API_KEY not configured"

**Solution:**
- OpenAI API key is required for prompt generation
- Add `OPENAI_API_KEY` to environment variables
- Verify key is valid and has credits

### Images not appearing in emails

**Solution:**
1. Verify `analysis_image_url` is saved in database
2. Check email HTML includes image
3. Some email clients block images - recipient must allow images
4. Verify image URL is accessible (check in browser)

---

## 💡 Best Practices

1. **Generate On-Demand**: Generate images when needed (before sending email) rather than for all leads
2. **Cache Results**: Once generated, images are stored - no need to regenerate
3. **Qualification**: Only generate for high-value leads (VIP/HOT/WARM) to save costs
4. **Monitor Costs**: Track Leonardo AI and OpenAI API usage
5. **Test First**: Generate a test image to verify setup before bulk generation

---

## 📋 Implementation Checklist

- [ ] Leonardo AI account created
- [ ] `LEONARDO_API_KEY` added to `.env.local`
- [ ] `LEONARDO_API_KEY` added to Vercel
- [ ] `OPENAI_API_KEY` configured (already done)
- [ ] Test image generation from admin dashboard
- [ ] Verify image appears in email
- [ ] Check image displays in lead detail modal

---

## 📞 Support Resources

- **Leonardo AI Docs**: https://docs.leonardo.ai
- **Leonardo AI API**: https://docs.leonardo.ai/reference
- **OpenAI API**: https://platform.openai.com/docs

---

## ✅ Summary

**What's Implemented:**
- ✅ Leonardo AI service for image generation
- ✅ API endpoint to generate images
- ✅ Automatic image inclusion in emails
- ✅ Admin dashboard "Generate Image" button
- ✅ Image display in lead detail modal
- ✅ Qualification checking
- ✅ Force generation option

**What You Need:**
- 🔑 Leonardo AI API key
- 🔑 OpenAI API key (already configured)
- ⚙️ Environment variables set

**Next Steps:**
1. Get Leonardo AI API key
2. Add to environment variables
3. Test image generation
4. Start using in outreach! 🎉

---

**Last Updated**: 2026-02-01  
**Status**: ✅ Complete Implementation
