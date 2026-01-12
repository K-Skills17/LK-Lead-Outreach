# 🚀 Deployment Guide - LK Reactor Pro

## Pre-Deployment Checklist

Before deploying, make sure you have:

- ✅ Supabase project set up
- ✅ Database migrations run (001_initial_schema.sql)
- ✅ Environment variables ready
- ✅ Logo files in `/public` folder
- ✅ All legal pages created (privacidade, termos, lgpd)

---

## 🎯 Recommended Platform: Vercel

**Why Vercel?**
- ✅ Built for Next.js (automatic optimization)
- ✅ Free tier available
- ✅ Easy environment variables setup
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Zero configuration deployment

---

## 📋 Step-by-Step Deployment

### Step 1: Push to GitHub

If you haven't already:

```bash
cd "C:\dev\Protocolo Receita Oculta\protocoloreceitaoculta"

# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - LK Reactor Pro"

# Create GitHub repository and push
# (Follow GitHub instructions to connect your repo)
git remote add origin https://github.com/your-username/lk-reactor-pro.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
cd "C:\dev\Protocolo Receita Oculta\protocoloreceitaoculta"
vercel
```

4. **Follow prompts:**
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? `lk-reactor-pro`
   - Directory? `./` (press Enter)
   - Override settings? **N**

5. **Deploy to Production:**
```bash
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to: https://vercel.com
2. Click **"Add New Project"**
3. **Import** your GitHub repository
4. Vercel auto-detects Next.js
5. Click **"Deploy"**

---

### Step 3: Configure Environment Variables

In Vercel Dashboard:

1. Go to your project
2. Click **"Settings"** → **"Environment Variables"**
3. Add these variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Sender Service
SENDER_SERVICE_TOKEN=your-sender-token

# Mercado Pago Payment Links
NEXT_PUBLIC_PRO_PAYMENT_URL=https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=a3f6b15eafd8472a97fe7baad51abe44
NEXT_PUBLIC_PREMIUM_PAYMENT_URL=https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=c6030c5ab09840bb9d5bace215ef721a

# Admin Dashboard (optional - add later)
ADMIN_DASHBOARD_TOKEN=your-secure-admin-token

# Facebook (add later when ready)
# NEXT_PUBLIC_FB_PIXEL_ID=1410687670551454
# FB_CAPI_ACCESS_TOKEN=your-access-token
# FB_TEST_EVENT_CODE=your-test-code
```

4. Click **"Save"**
5. **Redeploy** the project

---

### Step 4: Configure Custom Domain (Optional)

1. In Vercel Dashboard → **"Settings"** → **"Domains"**
2. Add your domain: `lkreactor.com.br` (or whatever you have)
3. Follow DNS configuration instructions
4. Wait for DNS propagation (can take up to 48 hours)

**Vercel will provide:**
- Automatic HTTPS
- SSL certificate
- Global CDN

---

## 🗄️ Database Setup (Supabase)

Make sure these migrations are run in Supabase:

### Essential (Run Now):
1. `001_initial_schema.sql` - Core tables
2. `003_analytics_tracking.sql` - Analytics (if ready)
3. `004_analytics_functions.sql` - Analytics functions (if ready)
4. `005_admin_users.sql` - Admin login (if ready)

### Run in Supabase SQL Editor:

1. Go to: https://app.supabase.com
2. Select your project
3. Click **"SQL Editor"**
4. Click **"New Query"**
5. Paste migration SQL
6. Click **"Run"**

---

## ✅ Post-Deployment Checklist

After deployment, test these:

### Critical Pages:
- [ ] Landing page: `https://yourdomain.com/`
- [ ] Pricing page: `https://yourdomain.com/precos`
- [ ] Setup/Download: `https://yourdomain.com/setup`
- [ ] Thank you pages: `/obrigado`, `/obrigado-pro`
- [ ] Payment status: `/pagamento-pendente`, `/pagamento-falhou`

### Legal Pages:
- [ ] Privacy Policy: `https://yourdomain.com/privacidade`
- [ ] Terms of Service: `https://yourdomain.com/termos`
- [ ] LGPD: `https://yourdomain.com/lgpd`

### Functionality:
- [ ] Form submission works
- [ ] Calculator shows results
- [ ] Payment buttons link correctly
- [ ] Logo displays properly
- [ ] Mobile responsive
- [ ] All links work

---

## 🔧 Environment Variables Reference

### Required (Must Have):
```env
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key
SENDER_SERVICE_TOKEN=             # Token for sender API
```

### Payment Links (Required):
```env
NEXT_PUBLIC_PRO_PAYMENT_URL=      # Professional plan payment
NEXT_PUBLIC_PREMIUM_PAYMENT_URL=  # Premium plan payment
```

### Optional (Add Later):
```env
ADMIN_DASHBOARD_TOKEN=            # Admin dashboard access
NEXT_PUBLIC_FB_PIXEL_ID=          # Facebook Pixel
FB_CAPI_ACCESS_TOKEN=             # Facebook CAPI
FB_TEST_EVENT_CODE=               # Facebook testing
```

---

## 🐛 Troubleshooting

### Build Fails:

**Check:**
1. All dependencies installed: `npm install`
2. No TypeScript errors: `npm run build` locally
3. Environment variables set correctly
4. No missing imports

### Pages Not Loading:

**Check:**
1. Environment variables are set in Vercel
2. Supabase is accessible (not paused)
3. Check Vercel logs for errors

### Images Not Showing:

**Verify:**
1. Images are in `/public` folder
2. Image paths start with `/` (e.g., `/lk-reactor-logo.svg`)
3. Images are committed to Git

### Database Connection Fails:

**Verify:**
1. `NEXT_PUBLIC_SUPABASE_URL` is correct
2. `SUPABASE_SERVICE_ROLE_KEY` is correct
3. Supabase project is not paused
4. RLS policies are configured

---

## 🔄 Redeploying (After Changes)

### Automatic (Recommended):
Every `git push` to `main` branch automatically deploys.

```bash
git add .
git commit -m "Update: description of changes"
git push
```

Vercel automatically builds and deploys!

### Manual:
```bash
vercel --prod
```

---

## 📊 Monitoring

### Vercel Dashboard:
- **Analytics**: See page views, performance
- **Logs**: Check for errors
- **Deployments**: View deployment history

### Supabase Dashboard:
- **Database**: Monitor queries
- **API**: Check API usage
- **Logs**: View database logs

---

## 🚀 After Deployment - Track Later

Once your site is live, come back to set up:

1. ✅ Facebook Pixel (`NEXT_PUBLIC_FB_PIXEL_ID=1410687670551454`)
2. ✅ Facebook CAPI (`FB_CAPI_ACCESS_TOKEN`)
3. ✅ Admin Dashboard (`ADMIN_DASHBOARD_TOKEN`)
4. ✅ Test analytics tracking
5. ✅ Run Supabase migrations for analytics

**See these docs when ready:**
- `FACEBOOK_CAPI_SETUP.md` - Facebook tracking
- `ANALYTICS_DASHBOARD_SETUP.md` - Admin dashboard
- `ADMIN_LOGIN_SETUP.md` - Admin access

---

## 📞 Support

**Email**: contato@lkdigital.org  
**WhatsApp**: +55 11 95282-9271

---

## ✅ Quick Deploy Commands

```bash
# 1. Build locally to test
npm run build

# 2. Install Vercel CLI
npm install -g vercel

# 3. Login
vercel login

# 4. Deploy to production
vercel --prod
```

---

**Ready to deploy!** 🎉

Run `npm run build` first to make sure everything compiles correctly, then push to Vercel!
