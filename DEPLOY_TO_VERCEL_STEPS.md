# 🚀 Deploy to Vercel - Step by Step

## ⚡ Quick Method (5 Minutes)

### Step 1: Push Code to GitHub

```bash
# If you haven't initialized git yet:
git init
git add .
git commit -m "Initial commit - LK Lead Outreach"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/lk-lead-outreach.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel

1. **Go to Vercel:**
   - Visit: https://vercel.com
   - Click **"Sign Up"** (or Login)
   - **Use GitHub** to sign in (recommended)

2. **Import Project:**
   - Click **"Add New..."** → **"Project"**
   - Find your `lk-lead-outreach` repository
   - Click **"Import"**

3. **Configure (Auto-detected):**
   - Framework: **Next.js** ✅
   - Root Directory: `./` ✅
   - Build Command: `npm run build` ✅
   - Output Directory: `.next` ✅

4. **Click "Deploy"** (don't add env vars yet)

5. **Wait 2-3 minutes** for first deployment

### Step 3: Add Environment Variables

**After first deploy:**

1. Go to **Project Settings** → **Environment Variables**
2. Add each variable:

**Required:**
```
NEXT_PUBLIC_SUPABASE_URL = your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key
SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
```

**Recommended:**
```
OPENAI_API_KEY = your_openai_key
SENDER_SERVICE_TOKEN = your_sender_token
RESEND_API_KEY = your_resend_key
EMAIL_FROM = noreply@yourdomain.com
LEAD_GEN_INTEGRATION_TOKEN = your_integration_token
```

**For each variable:**
- ✅ Check **Production**
- ✅ Check **Preview** (optional)
- ✅ Check **Development** (optional)

3. **Redeploy:**
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**
   - ✅ Done!

## ✅ Verify Deployment

Visit your app:
```
https://your-app-name.vercel.app
```

Test endpoints:
- Dashboard: `https://your-app-name.vercel.app/dashboard`
- Status: `https://your-app-name.vercel.app/api/integration/status`

## 🔄 Update Your Lead Gen Tool

**Update API URLs in your Lead Gen Tool:**

**Old (Local):**
```
http://localhost:3000/api/integration/leads/receive
```

**New (Production):**
```
https://your-app-name.vercel.app/api/integration/leads/receive
```

## 📋 Post-Deployment Checklist

- [ ] Environment variables added
- [ ] Database migrations run in Supabase
- [ ] Test dashboard loads
- [ ] Test API endpoints
- [ ] Update Lead Gen Tool with production URL
- [ ] Create first SDR user
- [ ] Test email sending
- [ ] Test integration with Lead Gen Tool

## 🎯 Continuous Deployment

**From now on:**
```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main

# Vercel automatically deploys!
# Check status: https://vercel.com/your-project
```

## 📚 Full Guide

See `VERCEL_DEPLOYMENT_GUIDE.md` for:
- Detailed instructions
- Troubleshooting
- Custom domain setup
- Monitoring

---

**That's it! Your app is live on Vercel!** 🎉
