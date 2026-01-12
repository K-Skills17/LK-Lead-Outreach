# 🔐 Environment Variables Setup

Copy these to your `.env.local` file and fill in with your actual values.

```bash
# ============================================
# SUPABASE
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# ============================================
# MERCADO PAGO
# ============================================
# Get these from: https://www.mercadopago.com.br/developers
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxx  # Change to PROD key for production
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxx  # Change to PROD token for production

# Payment Links (create these in Mercado Pago dashboard)
NEXT_PUBLIC_PRO_PAYMENT_URL=https://mpago.la/YOUR_PRO_LINK
NEXT_PUBLIC_PREMIUM_PAYMENT_URL=https://mpago.la/YOUR_PREMIUM_LINK

# ============================================
# SENDER SERVICE
# ============================================
# Used by desktop app to authenticate API requests
# Generate a secure random string: openssl rand -hex 32
SENDER_SERVICE_TOKEN=your_secure_random_token_here_min_32_chars

# ============================================
# OPENAI (For AI Features)
# ============================================
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your_openai_api_key_here

# ============================================
# OPTIONAL: EMAIL SERVICE
# ============================================
# If you want to send automated emails
# SENDGRID_API_KEY=your_sendgrid_key
# EMAIL_FROM=noreply@yourdomain.com

# ============================================
# OPTIONAL: ANALYTICS
# ============================================
# Google Analytics
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Facebook Pixel
# NEXT_PUBLIC_FB_PIXEL_ID=123456789

# ============================================
# DEVELOPMENT SETTINGS
# ============================================
# Set to 'development' for local, 'production' for live
NODE_ENV=development

# Your domain (used for redirects and webhooks)
# NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_APP_URL=https://yourdomain.com  # Production
```

## 📝 Important Notes

1. **Never commit `.env.local` to git** - It's already in `.gitignore`
2. **Use TEST credentials for development** - Switch to PROD before launch
3. **Keep secrets secret**:
   - `SENDER_SERVICE_TOKEN`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `MERCADOPAGO_ACCESS_TOKEN`
4. **Regenerate tokens if compromised**
5. **Update payment URLs** after creating Mercado Pago links

## 🔑 How to Get Each Credential

### Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create project (if new)
3. Settings → API → Copy URL and keys

### Mercado Pago
1. Go to [developers.mercadopago.com.br](https://www.mercadopago.com.br/developers)
2. Create application
3. Get credentials (test & production)
4. Create payment links in dashboard
5. Configure success/pending/failure URLs

### OpenAI
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API key
3. Add billing info
4. Copy key (starts with `sk-`)

### Sender Service Token
Generate a secure random token:
```bash
# On Mac/Linux
openssl rand -hex 32

# On Windows PowerShell
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## 🚀 Deployment

When deploying to Vercel/Netlify:
1. Add all environment variables in the hosting platform's dashboard
2. Use production credentials (not TEST)
3. Update payment URLs to production domain
4. Test thoroughly before going live
