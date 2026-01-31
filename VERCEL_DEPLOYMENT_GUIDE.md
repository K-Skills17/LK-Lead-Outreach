# 🚀 Vercel Deployment Guide - LK Lead Outreach

## 📋 Prerequisites

Before deploying, make sure you have:

- ✅ GitHub account (or GitLab/Bitbucket)
- ✅ Vercel account (free tier works!)
- ✅ Supabase project set up
- ✅ All environment variables ready

## 🎯 Quick Deployment (5 Minutes)

### Step 1: Push to GitHub

If you haven't already:

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - LK Lead Outreach"

# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/lk-lead-outreach.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Go to Vercel:**
   - Visit: https://vercel.com
   - Sign up/Login (use GitHub)

2. **Import Project:**
   - Click **"Add New..."** → **"Project"**
   - Import your GitHub repository
   - Select `lk-lead-outreach` repository

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Add Environment Variables:**
   - Click **"Environment Variables"**
   - Add all variables from your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
SENDER_SERVICE_TOKEN=your_sender_token
RESEND_API_KEY=your_resend_key
EMAIL_FROM=noreply@yourdomain.com
LEAD_GEN_INTEGRATION_TOKEN=your_integration_token
```

5. **Deploy:**
   - Click **"Deploy"**
   - Wait 2-3 minutes
   - ✅ Done! Your app is live!

## 🔧 Detailed Setup

### Environment Variables in Vercel

**Important:** Add these in Vercel Dashboard → Settings → Environment Variables

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Recommended:**
- `OPENAI_API_KEY`
- `SENDER_SERVICE_TOKEN`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `LEAD_GEN_INTEGRATION_TOKEN`

**For each environment:**
- ✅ Production
- ✅ Preview
- ✅ Development

### Database Migrations

**After deployment, run migrations in Supabase:**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run: `supabase/migrations/000_complete_setup.sql`
3. Verify tables exist

**Or run migrations in order:**
1. `001_initial_schema.sql`
2. `008_update_lead_outreach_schema.sql`
3. `010_sdr_users_and_auth.sql`

## 📝 Post-Deployment Checklist

### 1. Verify Deployment

- ✅ Visit your Vercel URL: `https://your-app.vercel.app`
- ✅ Check dashboard loads: `https://your-app.vercel.app/dashboard`
- ✅ Test API: `https://your-app.vercel.app/api/integration/status`

### 2. Update API URLs

**In your Lead Gen Tool, update:**
```
https://your-app.vercel.app/api/integration/leads/receive
https://your-app.vercel.app/api/integration/webhook
```

### 3. Test Integration

```bash
curl -X POST https://your-app.vercel.app/api/integration/leads/receive \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Test",
    "empresa": "Test Co",
    "email": "test@example.com",
    "phone": "+5511999999999",
    "send_email_first": false
  }'
```

### 4. Create First SDR User

Run in Supabase SQL Editor:

```sql
-- Generate password hash first, then:
INSERT INTO sdr_users (email, password_hash, name, role)
VALUES (
  'sdr1@yourcompany.com',
  '$2b$10$...your_hashed_password...',
  'John Doe',
  'sdr'
);
```

## 🔄 Continuous Deployment

**Vercel automatically:**
- ✅ Deploys on every `git push`
- ✅ Creates preview deployments for PRs
- ✅ Runs build checks
- ✅ Shows deployment status

**Workflow:**
```
1. Make changes locally
2. git push origin main
3. Vercel automatically deploys
4. ✅ Live in 2-3 minutes
```

## 🌐 Custom Domain (Optional)

### Step 1: Add Domain in Vercel

1. Go to **Project Settings** → **Domains**
2. Add your domain: `outreach.yourdomain.com`
3. Follow DNS instructions

### Step 2: Update DNS

Add CNAME record:
```
Type: CNAME
Name: outreach (or @)
Value: cname.vercel-dns.com
```

### Step 3: SSL Certificate

- ✅ Vercel automatically provisions SSL
- ✅ HTTPS enabled by default
- ✅ No configuration needed

## 🔐 Security Best Practices

### 1. Environment Variables

- ✅ Never commit `.env.local` to Git
- ✅ Add all secrets to Vercel Environment Variables
- ✅ Use different tokens for production/preview

### 2. API Security

- ✅ Always use HTTPS in production
- ✅ Rotate tokens periodically
- ✅ Monitor API usage

### 3. Database Security

- ✅ Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- ✅ Use RLS (Row Level Security) where possible
- ✅ Regular backups

## 📊 Monitoring

### Vercel Analytics

- **Deployments:** See all deployments
- **Logs:** View server logs
- **Analytics:** Performance metrics
- **Functions:** API endpoint usage

### Check Logs

1. Go to **Vercel Dashboard** → **Your Project**
2. Click **"Deployments"**
3. Click on a deployment
4. View **"Functions"** tab for API logs

## 🐛 Troubleshooting

### Build Fails

**Error:** "Module not found"
- ✅ Check `package.json` dependencies
- ✅ Run `npm install` locally first
- ✅ Check for TypeScript errors

**Error:** "Environment variable missing"
- ✅ Add all required env vars in Vercel
- ✅ Check variable names (case-sensitive)
- ✅ Redeploy after adding vars

### API Not Working

**Error:** "Unauthorized"
- ✅ Check `LEAD_GEN_INTEGRATION_TOKEN` is set
- ✅ Verify token matches in Lead Gen Tool
- ✅ Check Authorization header format

**Error:** "Database error"
- ✅ Verify Supabase credentials
- ✅ Check migrations ran successfully
- ✅ Verify tables exist

### Database Connection Issues

**Error:** "Connection refused"
- ✅ Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- ✅ Verify Supabase project is active
- ✅ Check network restrictions

## 🎯 Production Checklist

Before going live:

- [ ] All environment variables added to Vercel
- [ ] Database migrations run in Supabase
- [ ] First SDR user created
- [ ] Test API endpoints
- [ ] Test email sending (Resend)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Lead Gen Tool configured with production URL
- [ ] Monitoring set up
- [ ] Backup strategy in place

## 📈 Scaling

**Vercel Free Tier:**
- ✅ 100GB bandwidth/month
- ✅ Unlimited requests
- ✅ Automatic scaling
- ✅ Global CDN

**When to Upgrade:**
- Vercel Pro ($20/month): More bandwidth, better performance
- Supabase Pro ($25/month): More database space

**For internal tool with multiple SDRs, free tier is usually enough!**

## 🔄 Update Process

**To update your app:**

```bash
# 1. Make changes locally
# 2. Test locally: npm run dev
# 3. Commit and push
git add .
git commit -m "Update: description"
git push origin main

# 4. Vercel automatically deploys
# 5. Check deployment status in Vercel dashboard
```

## 📚 Additional Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Supabase Docs:** https://supabase.com/docs

## ✅ Quick Reference

**Deploy URL:** `https://your-app.vercel.app`

**API Endpoints:**
- `https://your-app.vercel.app/api/integration/leads/receive`
- `https://your-app.vercel.app/api/integration/webhook`
- `https://your-app.vercel.app/api/integration/status`
- `https://your-app.vercel.app/api/sdr/login`
- `https://your-app.vercel.app/api/sdr/dashboard`

**Dashboard:**
- `https://your-app.vercel.app/dashboard`

---

**Need help?** Check Vercel logs or Supabase logs for error details!
