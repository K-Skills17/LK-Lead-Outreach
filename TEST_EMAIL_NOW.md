# 🧪 TEST YOUR EMAIL SYSTEM NOW!

## ✅ READY TO TEST!

Everything is set up! Follow these steps to test your email integration:

---

## 🚀 **QUICK TEST (2 minutes)**

### **Step 1: Make Sure API Key is Set**

Check your `.env.local` file has this line:
```
RESEND_API_KEY=re_your_actual_api_key_here
```

**Don't have it yet?**
1. Go to: https://resend.com/api-keys
2. Create a new API key
3. Copy it and add to `.env.local`

---

### **Step 2: Edit Test Script with YOUR Email**

Open `scripts/test-email.ts` and change line 12:
```typescript
email: 'your-email@example.com',  // ← CHANGE THIS TO YOUR EMAIL!
```

Change to:
```typescript
email: 'YOUR_ACTUAL_EMAIL@gmail.com',  // ← Your real email here!
```

**Important:** Use YOUR email so you can verify the email arrives!

---

### **Step 3: Run the Test**

```bash
npx tsx scripts/test-email.ts
```

This will send a FREE license email to your inbox!

---

## 📧 **WHAT TO EXPECT**

### **In Terminal:**
```
╔════════════════════════════════════════════════════════════╗
║   🧪 RESEND EMAIL SYSTEM TEST                              ║
║                                                            ║
║   This script will send test emails to verify integration ║
╚════════════════════════════════════════════════════════════╝

✅ RESEND_API_KEY found in environment
🔑 API Key: re_xxxxxxx...

🧪 Testing FREE license email...

📋 Test data:
  Name: João Silva
  Email: your@email.com
  License Key: LKRP-A1B2-C3D4-E5F6
  Clinic: Clínica Teste

✅ FREE license email sent successfully!
📧 Email ID: abc123-def456-ghi789

🎯 Next steps:
  1. Check your email inbox: your@email.com
  2. Look for subject: "🎉 Seu Acesso GRATUITO ao LK Reactor Pro está Ativo!"
  3. Verify the license key is displayed correctly
  4. Check that all links work

════════════════════════════════════════════════════════════
✅ Test completed!
```

### **In Your Email Inbox:**

You should receive an email with:
- ✅ Subject: "🎉 Seu Acesso GRATUITO ao LK Reactor Pro está Ativo!"
- ✅ Beautiful HTML design (blue gradient header)
- ✅ Your license key in a box (format: LKRP-XXXX-XXXX-XXXX)
- ✅ Download button
- ✅ Step-by-step activation instructions
- ✅ Support contact info

---

## 🎯 **TEST OTHER EMAIL TYPES**

### **Test PRO Plan Email:**
```bash
npx tsx scripts/test-email.ts paid
```

### **Test PREMIUM Plan Email:**
```bash
npx tsx scripts/test-email.ts premium
```

### **Test ALL Emails:**
```bash
npx tsx scripts/test-email.ts all
```

---

## ❌ **TROUBLESHOOTING**

### **Error: "RESEND_API_KEY not found"**

**Solution:**
1. Check if `.env.local` exists
2. Add this line:
   ```
   RESEND_API_KEY=re_your_actual_key_here
   ```
3. Save file and run test again

---

### **Error: "API key is invalid"**

**Solution:**
1. Go to: https://resend.com/api-keys
2. Verify your key is active
3. Create a new one if needed
4. Update `.env.local`

---

### **Error: "Email address is not verified"**

**Problem:** Resend requires sender domain verification in production

**Solution (Quick Test):**
You can test with `onboarding@resend.dev` temporarily:

Edit `lib/email-service.ts` line 7:
```typescript
const FROM_EMAIL = 'LK Reactor Pro <onboarding@resend.dev>';
```

Run test again!

**For Production (Required Before Launch):**
1. Go to: https://resend.com/domains
2. Add your domain: `lkdigital.org`
3. Add DNS records (Resend will show you which ones)
4. Wait for verification (~5 minutes)
5. Then use: `LK Reactor Pro <contato@lkdigital.org>`

---

### **Email Sent But Not Received?**

1. **Check spam folder** 📬
2. **Wait 1-2 minutes** (sometimes delayed)
3. **Check Resend dashboard:** https://resend.com/emails
   - See all sent emails
   - Check delivery status
   - View any errors

---

## ✅ **VERCEL DEPLOYMENT**

Once local testing works, add API key to Vercel:

1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add:
   - **Name:** `RESEND_API_KEY`
   - **Value:** `re_your_actual_key_here`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
3. Click **Save**
4. **Redeploy:** Vercel → Deployments → ⋯ → Redeploy

---

## 🎉 **SUCCESS CHECKLIST**

After testing, verify:

- [ ] Email arrived in inbox (check spam too!)
- [ ] License key displayed correctly (format: LKRP-XXXX-XXXX-XXXX)
- [ ] Email design looks professional
- [ ] All text is in Portuguese
- [ ] Download button is visible
- [ ] Support contact info is correct
- [ ] Clinic info shows at bottom
- [ ] Paid email shows invoice details (if testing paid)
- [ ] Links work (download, pricing, WhatsApp)

---

## 📊 **MONITORING EMAILS**

### **Resend Dashboard:**
https://resend.com/emails

See:
- ✅ All sent emails
- ✅ Delivery status
- ✅ Open rates
- ✅ Click rates
- ✅ Errors/bounces

### **Production Testing:**

Once deployed, test the full flow:
1. Go to your site: https://your-domain.com
2. Fill out the diagnostic form
3. Submit (FREE plan)
4. Check if email arrives automatically
5. Verify license key works in desktop app

---

## 🚀 **READY TO TEST?**

**Run this command now:**
```bash
npx tsx scripts/test-email.ts
```

**Remember:** Edit `scripts/test-email.ts` line 12 with YOUR email first!

---

## 💡 **QUICK TIPS**

1. **Test ALL email types** (free, paid PRO, paid PREMIUM)
2. **Check on mobile** (emails should be responsive)
3. **Test with different email clients** (Gmail, Outlook, Apple Mail)
4. **Verify download link** works when you add it
5. **Monitor Resend dashboard** for delivery issues

---

## ✅ **AFTER TESTING**

Once emails work perfectly:

1. ✅ Add `RESEND_API_KEY` to Vercel
2. ✅ Verify your domain on Resend
3. ✅ Update `FROM_EMAIL` to use your domain
4. ✅ Update `DOWNLOAD_URL` with GitHub Release URL
5. ✅ Test the full flow end-to-end
6. ✅ Clean up test data from Supabase

---

**Need help? See any errors? Let me know!** 🚀
