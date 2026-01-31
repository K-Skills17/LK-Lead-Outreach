# ⚡ Quick Vercel Deployment (5 Minutes)

## 🚀 Step-by-Step

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/lk-lead-outreach.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to: https://vercel.com
2. Sign up/Login (use GitHub)
3. Click **"Add New..."** → **"Project"**
4. Import your repository
5. Click **"Deploy"** (don't configure yet)

### 3. Add Environment Variables

After first deploy, go to **Settings** → **Environment Variables**:

**Add these:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
SENDER_SERVICE_TOKEN
RESEND_API_KEY
EMAIL_FROM
LEAD_GEN_INTEGRATION_TOKEN
```

**For each:** Production, Preview, Development

### 4. Redeploy

After adding env vars:
- Go to **Deployments**
- Click **"Redeploy"** on latest deployment
- ✅ Done!

## ✅ Verify

Visit: `https://your-app.vercel.app/dashboard`

## 📝 Full Guide

See `VERCEL_DEPLOYMENT_GUIDE.md` for complete instructions.
