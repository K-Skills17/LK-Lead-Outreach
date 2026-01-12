# 📊 Analytics Dashboard & Facebook Pixel Setup

## Overview

Complete analytics tracking system with:
- **Admin Dashboard** - Real-time metrics and conversion tracking
- **Facebook Pixel Integration** - Track conversions for Facebook Ads
- **Event Tracking** - Monitor entire user journey

---

## 🗄️ Database Setup

### 1. Run Migrations

Execute these SQL migrations in your Supabase dashboard (SQL Editor):

```bash
# In order:
1. supabase/migrations/003_analytics_tracking.sql
2. supabase/migrations/004_analytics_functions.sql
```

This creates tables for:
- `page_views` - Track all page visits
- `leads` - Track form submissions and progress
- `downloads` - Track app downloads by plan type
- `conversion_events` - Track Facebook Pixel events
- `payment_events` - Track payment flow

---

## 🔐 Environment Variables

Add to your `.env.local`:

```env
# Admin Dashboard Access
ADMIN_DASHBOARD_TOKEN=your-secure-random-token-here

# Facebook Pixel (Get from Facebook Events Manager)
NEXT_PUBLIC_FB_PIXEL_ID=your-facebook-pixel-id-here
```

### How to Get Facebook Pixel ID:
1. Go to [Facebook Events Manager](https://business.facebook.com/events_manager)
2. Create a new Pixel or select existing one
3. Copy the Pixel ID (looks like: `123456789012345`)
4. Add to `.env.local` as shown above

---

## 📍 Admin Dashboard Access

### URL:
```
https://yourdomain.com/admin
```

### Login:
- **Token**: Use the value you set in `ADMIN_DASHBOARD_TOKEN`
- Token is saved in session storage (stays logged in until browser closes)

### Features:
✅ **Overview Stats**:
- Total visitors (unique + total)
- Completed leads
- Downloads by plan (Free, Professional, Premium)
- Total revenue
- Payment conversions

✅ **Conversion Funnel**:
- Visitors → Leads → Downloads → Payments
- Conversion rates at each stage

✅ **Form Abandonment Tracking**:
- See who started but didn't complete the form
- Identify drop-off points (Step 1, Step 2)

✅ **Recent Leads Table**:
- Name, email, WhatsApp, clinic name
- Lost revenue calculation
- Timestamp

✅ **Time Period Filter**:
- Last 7 days
- Last 30 days
- Last 90 days

---

## 📈 Facebook Pixel Events

### Automatically Tracked Events:

| Event | Trigger | Purpose |
|-------|---------|---------|
| `PageView` | Every page load | Track site traffic |
| `ViewContent` | View pricing page | Track interest |
| `Lead` | Complete form (Step 2) | Track lead generation |
| `InitiateCheckout` | Click payment button | Track purchase intent |
| `CompleteRegistration` | Download app | **MAIN CONVERSION** |
| `Purchase` | Complete payment | Track revenue |

### Main Conversion Event:
**`CompleteRegistration`** fires when a user downloads the app (any plan).

This is the event you should optimize for in Facebook Ads Manager.

---

## 🎯 Facebook Ads Setup

### 1. Create Custom Conversion (Optional)
In Facebook Events Manager:
- Go to **Custom Conversions**
- Create new conversion
- Event: `CompleteRegistration`
- Name: "App Download"

### 2. Create Facebook Ad Campaign
1. **Campaign Objective**: Conversions
2. **Conversion Event**: `CompleteRegistration` (or your custom conversion)
3. **Pixel**: Select your LK Reactor Pixel

### 3. Monitor Performance
- Check Events Manager to see tracked events
- View conversion data in Ads Manager
- Optimize campaigns based on `CompleteRegistration` events

---

## 🔧 Tracking Implementation

### Already Integrated Pages:
- ✅ Landing page (`/`) - Tracks form progress
- ✅ Pricing page (`/precos`) - Tracks payment clicks
- ✅ Setup page (`/setup`) - Tracks downloads

### Events Tracked:

#### Landing Page:
```typescript
- trackLeadStarted() // User starts form
- trackLeadStep1() // Completes diagnostic (Step 1)
- trackLeadStep2() // Enters contact info (Step 2)
- trackLeadCompleted() // Submits form
```

#### Pricing Page:
```typescript
- trackPageView('/precos')
- trackPaymentInitiated() // Clicks payment button
- fbInitiateCheckout() // Facebook Pixel event
```

#### Setup/Download Page:
```typescript
- trackDownload() // Downloads app
- fbCompleteRegistration() // Facebook Pixel CONVERSION
```

---

## 📊 Dashboard Metrics Explained

### Visitors
- **Total Visitors**: All page views
- **Unique Visitors**: Distinct sessions (tracked by session ID)

### Leads
- **Total Leads**: Started form
- **Completed Leads**: Finished all steps
- **Abandoned Leads**: Started but didn't finish

### Downloads
- **Free Downloads**: Downloaded free plan
- **Professional Downloads**: Downloaded after Pro payment
- **Premium Downloads**: Downloaded after Premium payment

### Payments
- **Payments Initiated**: Clicked payment button
- **Payments Completed**: Successfully paid
- **Total Revenue**: Sum of all completed payments

### Conversion Rates
- **Visitor → Lead**: % of visitors who complete form
- **Lead → Download**: % of leads who download app
- **Download → Payment**: % of downloads that convert to paid

---

## 🔒 Security

### Admin Dashboard:
- Protected by Bearer token authentication
- Token required in Authorization header
- No public access without valid token

### Analytics API:
- Internal API endpoint (`/api/analytics/track`)
- No authentication required (tracks public events)
- Rate limiting recommended (add if needed)

### Database:
- Row Level Security (RLS) enabled
- Service role can read/write
- No public access to analytics tables

---

## 🚀 Testing

### 1. Test Analytics Tracking:
```bash
# Open browser console on landing page
# Check for tracking calls:
fetch('/api/analytics/track', ...)
```

### 2. Test Facebook Pixel:
```bash
# Install Facebook Pixel Helper Chrome Extension
# Visit your site
# Check if pixel fires correctly
```

### 3. Test Admin Dashboard:
```bash
# Go to /admin
# Login with ADMIN_DASHBOARD_TOKEN
# Verify data appears
```

### 4. Test Full Funnel:
1. Visit landing page (tracked as page view)
2. Fill form Step 1 (tracked as lead_step1)
3. Fill form Step 2 (tracked as lead_step2)
4. View results (tracked as lead_completed)
5. Click pricing plan (tracked as payment_initiated)
6. Download app (tracked as download + CompleteRegistration)

---

## 📱 Facebook Pixel Verification

### Using Facebook Pixel Helper:
1. Install [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
2. Visit your website
3. Click extension icon
4. Verify pixel is firing

### Using Facebook Events Manager:
1. Go to Events Manager
2. Select your Pixel
3. Click "Test Events"
4. Enter your website URL
5. Perform actions and verify events appear in real-time

---

## 🎯 Optimization Tips

### For Better Conversion Tracking:
1. **Use UTM Parameters** in Facebook Ads:
   ```
   ?utm_source=facebook&utm_medium=cpc&utm_campaign=app_download
   ```

2. **Create Lookalike Audiences**:
   - Based on `CompleteRegistration` event
   - Target similar users who are likely to convert

3. **Set Up Conversion Value**:
   - Free: R$0
   - Professional: R$197
   - Premium: R$497

4. **Monitor Abandonment**:
   - Check admin dashboard for abandoned leads
   - Create retargeting campaigns for these users

---

## 🆘 Troubleshooting

### Facebook Pixel Not Firing:
- Check `NEXT_PUBLIC_FB_PIXEL_ID` is set correctly
- Verify no ad blockers are active
- Check browser console for errors
- Use Facebook Pixel Helper extension

### Admin Dashboard Not Loading:
- Verify `ADMIN_DASHBOARD_TOKEN` is set
- Check token matches exactly (no extra spaces)
- Check browser console for API errors

### Analytics Not Tracking:
- Check `/api/analytics/track` endpoint is accessible
- Verify Supabase migrations ran successfully
- Check Supabase logs for errors

### No Data in Dashboard:
- Wait a few minutes for data to populate
- Verify events are being tracked (check browser network tab)
- Check Supabase tables directly to confirm data exists

---

## 📞 Support

**Email**: contato@lkdigital.org  
**WhatsApp**: +55 11 95282-9271

---

**Last Updated**: 12 de janeiro de 2026  
**Status**: ✅ Ready for Production
