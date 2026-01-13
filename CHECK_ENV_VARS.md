# 🔍 Environment Variables Check & Setup Guide

## 🎯 Quick Check: What's Missing?

### **Step 1: Check Your Local `.env.local` File**

Open your `.env.local` file and look for these 3 critical variables:

```bash
# CRITICAL FOR DESKTOP APP
SENDER_SERVICE_TOKEN=???

# REQUIRED FOR YEARLY PLANS  
NEXT_PUBLIC_PRO_SUBSCRIBTION_YEARLY=???
NEXT_PUBLIC_PREMIUM_SUBSCRIBTION_YEARLY=???
```

---

## ⚠️ **If Any Are Missing or Say "YOUR_URL_HERE", Follow This Guide:**

---

## 1️⃣ **SENDER_SERVICE_TOKEN** - CRITICAL!

### **What It Does:**
- Authenticates your desktop app with the web server
- **WITHOUT THIS, THE DESKTOP APP CANNOT WORK!**

### **Generate It Now:**

#### **Windows PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

**Copy the output and save it!**

#### **Example Output:**
```
aB3xF7kL9mN2pQ5rT8vW1yZ4cE6gH0jK2lM5oP8qR3sU7wX1zA4
```

### **Add to `.env.local`:**
```bash
SENDER_SERVICE_TOKEN=aB3xF7kL9mN2pQ5rT8vW1yZ4cE6gH0jK2lM5oP8qR3sU7wX1zA4
```

### **Add to Vercel:**
1. Go to https://vercel.com/your-project/settings/environment-variables
2. Add new variable:
   - **Name**: `SENDER_SERVICE_TOKEN`
   - **Value**: (paste your generated token)
   - **Environment**: Production, Preview, Development (all)
3. Click "Save"
4. **Redeploy your project**

---

## 2️⃣ **Yearly Subscription URLs** - HIGH PRIORITY!

### **What They Do:**
- Direct users to Mercado Pago for yearly subscriptions
- **WITHOUT THESE, YEARLY PLAN BUTTONS WON'T WORK!**

### **Current Prices:**
- **PRO Yearly**: R$ 2.128/year (10% off monthly)
- **PREMIUM Yearly**: R$ 2.790/year (33% off monthly)

---

## 📋 **How to Create Yearly Plans in Mercado Pago**

### **Step-by-Step:**

1. **Go to Mercado Pago**
   - https://www.mercadopago.com.br/subscriptions/plan/list

2. **Click "Criar novo plano de assinatura"**

3. **For PRO Yearly Plan:**
   - **Nome**: LK Reactor PRO - Anual
   - **Valor**: R$ 2.128,00
   - **Frequência**: Anual (12 meses)
   - **Dias de trial**: 14
   - **Descrição**: Plano Professional Anual - Reative até 500 pacientes/dia

4. **For PREMIUM Yearly Plan:**
   - **Nome**: LK Reactor PREMIUM - Anual  
   - **Valor**: R$ 3.790,00
   - **Frequência**: Anual (12 meses)
   - **Dias de trial**: 14
   - **Descrição**: Plano Premium Anual - Mensagens ilimitadas + IA avançada

5. **Copy the URLs**
   - After creating each plan, copy the subscription link
   - Format: `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=XXXXXXXX`

---

## 📝 **Add URLs to `.env.local`:**

```bash
# Yearly Subscription URLs
NEXT_PUBLIC_PRO_SUBSCRIBTION_YEARLY=https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=YOUR_PRO_YEARLY_ID
NEXT_PUBLIC_PREMIUM_SUBSCRIBTION_YEARLY=https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=YOUR_PREMIUM_YEARLY_ID
```

---

## 🌐 **Add to Vercel:**

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Add these 3 variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `SENDER_SERVICE_TOKEN` | Your generated token | All |
| `NEXT_PUBLIC_PRO_SUBSCRIBTION_YEARLY` | Your PRO yearly URL | All |
| `NEXT_PUBLIC_PREMIUM_SUBSCRIBTION_YEARLY` | Your PREMIUM yearly URL | All |

3. **Redeploy** (Vercel → Deployments → Three dots → Redeploy)

---

## ✅ **Verify Everything is Set Up**

### **Local Check:**
```powershell
cd "C:\dev\Protocolo Receita Oculta\protocoloreceitaoculta"
Get-Content .env.local | Select-String "SENDER_SERVICE_TOKEN|YEARLY"
```

**Expected Output:**
```
SENDER_SERVICE_TOKEN=aB3xF7kL9mN2pQ5rT8vW1yZ4cE6gH0jK2lM5oP8qR3sU7wX1zA4
NEXT_PUBLIC_PRO_SUBSCRIBTION_YEARLY=https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=xxxxx
NEXT_PUBLIC_PREMIUM_SUBSCRIBTION_YEARLY=https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=xxxxx
```

### **Vercel Check:**
Visit: https://your-app.vercel.app/api/admin/diagnostic

**Should show:**
```json
{
  "status": "OK",
  "checks": {
    "NEXT_PUBLIC_SUPABASE_URL": true,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": true,
    "SUPABASE_SERVICE_ROLE_KEY": true,
    "ADMIN_DASHBOARD_TOKEN": true
  }
}
```

---

## 🧪 **Test Desktop App Connection**

After adding `SENDER_SERVICE_TOKEN`:

1. **Open your desktop app**
2. **Enter a license key**
3. **Try to verify**

**Expected**: ✅ "License verified successfully"

**If it fails**: 
- Check Vercel logs
- Verify token is exactly the same in desktop app config
- Ensure you redeployed after adding the variable

---

## 🎯 **Complete Environment Variables List**

Here's what your `.env.local` should have:

```bash
# ============================================
# Supabase (Database)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# ============================================
# Admin Dashboard
# ============================================
ADMIN_DASHBOARD_TOKEN=LKReactor2026SecureToken

# ============================================
# Mercado Pago - Monthly Subscriptions
# ============================================
NEXT_PUBLIC_PRO_SUBSCRIBTION=https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=a3f6b15eafd8472a97fe7baad51abe44
NEXT_PUBLIC_PREMIUM_SUBSCRIBTION=https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=c6030c5ab09840bb9d5bace215ef721a

# ============================================
# Mercado Pago - Yearly Subscriptions (ADD THESE!)
# ============================================
NEXT_PUBLIC_PRO_SUBSCRIBTION_YEARLY=https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=YOUR_PRO_YEARLY_ID
NEXT_PUBLIC_PREMIUM_SUBSCRIBTION_YEARLY=https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=YOUR_PREMIUM_YEARLY_ID

# ============================================
# Desktop App Authentication (ADD THIS!)
# ============================================
SENDER_SERVICE_TOKEN=aB3xF7kL9mN2pQ5rT8vW1yZ4cE6gH0jK2lM5oP8qR3sU7wX1zA4

# ============================================
# Facebook Tracking
# ============================================
NEXT_PUBLIC_FB_PIXEL_ID=1410687670551454
FB_CAPI_ACCESS_TOKEN=EAAMCby...
FB_TEST_EVENT_CODE=TEST12345

# ============================================
# OpenAI (AI Features)
# ============================================
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
```

---

## 🚀 **After Setup:**

1. ✅ Restart your local dev server (`npm run dev`)
2. ✅ Redeploy on Vercel
3. ✅ Test pricing page - yearly buttons should work
4. ✅ Test desktop app - should connect and verify licenses
5. ✅ Test payment flow - yearly subscriptions should process

---

## ⚠️ **Common Issues:**

### **Desktop App Says "Unauthorized"**
- `SENDER_SERVICE_TOKEN` not set or different between desktop and web
- Solution: Regenerate token, add to both places, redeploy

### **Yearly Buttons Don't Work**
- URLs not set or still have placeholders
- Solution: Create plans in Mercado Pago, add URLs, redeploy

### **Changes Don't Appear on Live Site**
- Vercel hasn't redeployed
- Solution: Go to Vercel → Deployments → Redeploy

---

## 📞 **Need Help?**

If you get stuck:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables in Vercel dashboard
4. Ensure you clicked "Redeploy" after adding variables

---

**Once these 3 variables are set, you're 100% ready to launch!** 🎉
