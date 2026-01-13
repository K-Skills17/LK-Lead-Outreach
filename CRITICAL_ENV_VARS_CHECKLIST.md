# 🚨 CRITICAL ENVIRONMENT VARIABLES - FINAL CHECK

**Status**: 🟡 **2 MISSING CRITICAL VARIABLES**

---

## ✅ **CODE IMPLEMENTATION STATUS**

### **1. SENDER_SERVICE_TOKEN** ✅ 
**Purpose**: Secure communication between desktop app and web API

**Implementation Status**: ✅ **FULLY IMPLEMENTED IN CODE**

**Used in 4 API endpoints**:
1. ✅ `app/api/auth/verify-license/route.ts` (line 19) - Desktop app auth
2. ✅ `app/api/sender/queue/route.ts` (line 19) - Get contacts to send
3. ✅ `app/api/sender/mark-sent/route.ts` (line 20) - Mark message sent
4. ✅ `app/api/sender/mark-failed/route.ts` (line 20) - Mark message failed

**What it does**:
```typescript
// Desktop app calls API with Bearer token
Authorization: Bearer YOUR_SENDER_SERVICE_TOKEN

// API validates token
const token = authHeader.substring(7);
const expectedToken = process.env.SENDER_SERVICE_TOKEN;

if (token !== expectedToken) {
  return 401 Unauthorized
}
```

**🚨 ACTION REQUIRED**: Add to Vercel environment variables

---

### **2. YEARLY SUBSCRIPTION URLs** ✅
**Purpose**: Mercado Pago checkout URLs for yearly plans

**Implementation Status**: ✅ **FULLY IMPLEMENTED IN CODE**

**Used in**:
- ✅ `app/precos/page.tsx` (lines 56, 82) - Pricing page CTA buttons
- ✅ `app/api/webhooks/mercadopago/route.ts` (lines 175, 177) - Payment processing

**Variables**:
1. `NEXT_PUBLIC_PRO_SUBSCRIBTION_YEARLY` 
   - Used for: PRO yearly plan button (R$ 2.128/year = R$ 177/month)
   - Webhook expects: `amount: 2128` → `tier: PRO, billingCycle: yearly`

2. `NEXT_PUBLIC_PREMIUM_SUBSCRIBTION_YEARLY`
   - Used for: PREMIUM yearly plan button (R$ 3.790/year = R$ 316/month)
   - Webhook expects: `amount: 3790` → `tier: PREMIUM, billingCycle: yearly`

**🚨 ACTION REQUIRED**: Add to Vercel environment variables

---

## 📋 **COMPLETE CHECKLIST**

### **What YOU Need to Do:**

#### **Step 1: Generate SENDER_SERVICE_TOKEN** (2 minutes)

**Option A - PowerShell (Windows):**
```powershell
# Generate a secure 64-character token
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Option B - Node.js:**
```javascript
// Run in terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option C - Online Tool:**
1. Go to: https://www.uuidgenerator.net/api/guid
2. Copy the generated GUID and remove hyphens

**Example output:**
```
aB3dEf7gH9jK2mN5pQ8rS1tU4vW7xY0zA3bC6dE9fG2hJ5kL8mN1oP4qR7sT0uV3w
```

**✅ SAVE THIS TOKEN** - You'll need it for:
1. Vercel environment variables
2. Desktop app configuration

---

#### **Step 2: Get Mercado Pago Yearly Subscription URLs** (15 minutes)

You need to create **2 yearly subscription plans** in Mercado Pago:

**PRO Yearly Plan:**
- Price: R$ 2.128,00 (exactly)
- Billing: Once per year
- Description: "Protocolo Receita Oculta - Plano PRO Anual (economize 10%)"

**PREMIUM Yearly Plan:**
- Price: R$ 3.790,00 (exactly)
- Billing: Once per year
- Description: "Protocolo Receita Oculta - Plano PREMIUM Anual (economize 33%)"

**How to create:**
1. Login to Mercado Pago
2. Go to **"Vendas online" → "Assinaturas"**
3. Click **"Criar plano de assinatura"**
4. Fill in:
   - Nome: "PRO Anual" or "PREMIUM Anual"
   - Valor: R$ 2.128,00 or R$ 3.790,00
   - Frequência: **Anual** (yearly)
   - Trial: 14 dias (optional)
5. Click **"Criar plano"**
6. Copy the **checkout URL** (looks like: `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=XXX`)

---

#### **Step 3: Add to Vercel Environment Variables** (5 minutes)

1. Go to: https://vercel.com/your-project/settings/environment-variables

2. Add these 3 variables:

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `SENDER_SERVICE_TOKEN` | *(paste your generated token)* | 🔒 CRITICAL - Desktop app won't work without this |
| `NEXT_PUBLIC_PRO_SUBSCRIBTION_YEARLY` | *(paste Mercado Pago PRO yearly URL)* | 💳 Required for yearly PRO purchases |
| `NEXT_PUBLIC_PREMIUM_SUBSCRIBTION_YEARLY` | *(paste Mercado Pago PREMIUM yearly URL)* | 💳 Required for yearly PREMIUM purchases |

3. Click **"Save"** for each variable

---

#### **Step 4: Redeploy** (1 minute)

**Option A - Automatic:**
- Vercel will automatically redeploy when you save environment variables

**Option B - Manual:**
```bash
# In your terminal
cd "C:\dev\Protocolo Receita Oculta\protocoloreceitaoculta"
git commit --allow-empty -m "Trigger Vercel redeploy"
git push origin main
```

---

## 🔍 **VERIFICATION**

### **Test 1: Check Pricing Page Buttons**

1. Go to: `https://your-domain.com/precos`
2. Toggle **"Anual"** billing cycle
3. Click **"Começar Teste Grátis"** on PRO plan
   - ✅ Should redirect to Mercado Pago PRO yearly checkout
   - ❌ If redirects to `#`, the env var is missing

4. Click **"Começar Teste Grátis"** on PREMIUM plan
   - ✅ Should redirect to Mercado Pago PREMIUM yearly checkout
   - ❌ If redirects to `#`, the env var is missing

---

### **Test 2: Check Desktop App Authentication**

1. Open desktop app (LK Reactor Pro.exe)
2. Enter a valid license key
3. Desktop app should call: `POST /api/auth/verify-license`
   - **With Bearer token**: `Authorization: Bearer YOUR_SENDER_SERVICE_TOKEN`
   
4. ✅ **Success**: Desktop app shows "Licença verificada"
5. ❌ **Failure**: Shows "Unauthorized" or "Invalid token"

---

### **Test 3: Check Webhook Payment Processing**

1. Make a test payment (yearly plan) in Mercado Pago sandbox
2. Webhook should receive payment with amount `2128` or `3790`
3. Check Vercel logs: Should see:
   ```
   ✅ Activating PRO (yearly) for clinic XXX
   ```
   or
   ```
   ✅ Activating PREMIUM (yearly) for clinic XXX
   ```

4. Verify in Supabase `subscriptions` table:
   - `tier` = PRO or PREMIUM
   - `billing_cycle` = yearly
   - `current_period_end` = 1 year from now

---

## 🎯 **CURRENT STATUS SUMMARY**

| Component | Code | Env Var | Status |
|-----------|------|---------|--------|
| Desktop app auth | ✅ | ❌ | 🟡 **NEEDS ENV VAR** |
| License verification API | ✅ | ❌ | 🟡 **NEEDS ENV VAR** |
| Sender queue API | ✅ | ❌ | 🟡 **NEEDS ENV VAR** |
| Sender mark-sent API | ✅ | ❌ | 🟡 **NEEDS ENV VAR** |
| Sender mark-failed API | ✅ | ❌ | 🟡 **NEEDS ENV VAR** |
| PRO yearly pricing button | ✅ | ❌ | 🟡 **NEEDS ENV VAR** |
| PREMIUM yearly pricing button | ✅ | ❌ | 🟡 **NEEDS ENV VAR** |
| Webhook yearly payment processing | ✅ | ✅ | ✅ **READY** |

---

## 🚨 **IMPACT IF NOT FIXED**

### **If `SENDER_SERVICE_TOKEN` is missing:**
- ❌ Desktop app CANNOT authenticate
- ❌ License verification FAILS
- ❌ Desktop app CANNOT send messages
- ❌ Desktop app CANNOT sync campaign data
- 🛑 **CRITICAL: ENTIRE DESKTOP APP BREAKS**

### **If yearly URLs are missing:**
- ❌ Yearly plan buttons show `#` (no link)
- ❌ Users CANNOT purchase yearly plans
- ❌ Lose revenue from yearly subscriptions
- ❌ Poor user experience (broken buttons)

---

## ✅ **AFTER YOU ADD THESE 3 VARIABLES:**

### **You will be 100% READY TO LAUNCH! 🚀**

All code is implemented ✅  
All routes are secured ✅  
All webhooks are configured ✅  
All thank you pages are created ✅  
All pricing logic is correct ✅  
All database migrations are ready ✅  

**Only missing**: 3 environment variable values (20 minutes of work)

---

## 📞 **NEED HELP?**

**Problem**: "I don't know how to create yearly plans in Mercado Pago"
**Solution**: 
1. Go to: https://www.mercadopago.com.br/developers/pt/docs/subscriptions/integration-configuration/subscriptions-creation
2. Follow the step-by-step guide
3. Or use the Mercado Pago dashboard UI

**Problem**: "Desktop app still says Unauthorized"
**Solution**:
1. Verify `SENDER_SERVICE_TOKEN` is set in Vercel
2. Redeploy Vercel
3. Check desktop app is using the SAME token value
4. Desktop app needs to send: `Authorization: Bearer YOUR_SENDER_SERVICE_TOKEN`

---

## 🎊 **FINAL LAUNCH CHECKLIST**

- [ ] Generate `SENDER_SERVICE_TOKEN` (2 min)
- [ ] Create Mercado Pago yearly plans (15 min)
- [ ] Add 3 env vars to Vercel (5 min)
- [ ] Redeploy Vercel (automatic)
- [ ] Test pricing page buttons (2 min)
- [ ] Test desktop app login (2 min)
- [ ] Run database verification query (1 min)
- [ ] **LAUNCH!** 🚀

**Total time to completion: 27 minutes** ⏱️
