# 🔐 Update Your .env.local File

Add these two lines to your `.env.local` file:

```bash
# Mercado Pago Payment Links
NEXT_PUBLIC_PRO_PAYMENT_URL=https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=a3f6b15eafd8472a97fe7baad51abe44
NEXT_PUBLIC_PREMIUM_PAYMENT_URL=https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=c6030c5ab09840bb9d5bace215ef721a
```

## How to Update:

1. Open `.env.local` in your project root
2. Add or replace these two lines
3. Save the file
4. **IMPORTANT**: Restart the dev server:
   - Stop: Press `Ctrl + C` in terminal
   - Start: Run `npm run dev`

## Verification:

After restarting, test the buttons:
1. Go to http://localhost:3000/precos
2. Click "Ativar Professional" - Should redirect to Pro subscription page
3. Click "Ativar Premium" - Should redirect to Premium subscription page

---

**Status**: Ready to add! ✅
