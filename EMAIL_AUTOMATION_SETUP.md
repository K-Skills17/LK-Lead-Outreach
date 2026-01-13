# 📧 EMAIL AUTOMATION SETUP - License Key Delivery

## ❌ **CURRENT STATUS: NO EMAIL AUTOMATION**

Right now, your system does **NOT automatically send emails** with license keys when users:
- ✅ Submit the landing page form → Saved to `leads` table
- ❌ Download the app → **NO email sent**
- ❌ Complete payment → **NO email sent**
- ❌ Get license key → **Displayed on screen only**

**Evidence:**
```typescript
// app/api/webhooks/mercadopago/route.ts (line 121-122)
// TODO: Send activation email to clinic.email
// await sendActivationEmail(clinic.email, clinic.name, tier, licenseKey);
```

This TODO comment shows email automation was planned but never implemented!

---

## 🎯 **WHAT YOU NEED:**

Automated emails should be sent in these scenarios:

### **Scenario 1: FREE Plan - Lead Submission**
**When:** User completes 3-step form on landing page  
**Email:** Welcome email with FREE license key  
**Contains:**
- Welcome message
- FREE license key (14-day premium trial)
- Download link for desktop app
- Setup instructions
- WhatsApp support link

### **Scenario 2: PAID Plan - Payment Completed**
**When:** Mercado Pago webhook confirms payment  
**Email:** Activation email with PRO/PREMIUM license key  
**Contains:**
- Payment confirmation
- PRO or PREMIUM license key
- Download link for desktop app
- Receipt/invoice
- Setup instructions
- Billing details

### **Scenario 3: License Key Retrieval**
**When:** User requests license key via email/support  
**Email:** License key reminder  
**Contains:**
- User's license key
- Current subscription tier
- Expiration date (if applicable)
- Download link

---

## 🔧 **3 WAYS TO IMPLEMENT EMAIL AUTOMATION:**

---

## **OPTION 1: Make.com (Easiest - Recommended)** ⭐

**Why:** You're already using Make.com for lead submissions!

### **Pros:**
- ✅ Already familiar with Make.com
- ✅ No coding required
- ✅ Visual workflow builder
- ✅ Can connect to Gmail, SendGrid, Mailgun, etc.
- ✅ FREE tier available (1000 operations/month)

### **Cons:**
- ❌ Costs money after free tier
- ❌ Requires external service

---

### **Setup Steps:**

#### **Step 1: Create Webhook Scenarios in Make.com**

**Scenario A: Free Plan Email**
1. Login to Make.com
2. Create new scenario
3. Add trigger: **Webhook** → "Custom Webhook"
4. Copy webhook URL (e.g., `https://hook.make.com/abc123...`)
5. Add module: **Gmail** (or SendGrid, Mailgun, etc.)
6. Configure email template:

```
Subject: 🎉 Seu Acesso ao LK Reactor Pro - 14 Dias GRÁTIS!

Body:
Olá {{name}},

Bem-vindo ao LK Reactor Pro! 🎊

Aqui está sua chave de licença GRATUITA:

🔑 CHAVE DE LICENÇA: {{licenseKey}}

✨ Você tem 14 DIAS DE ACESSO PREMIUM totalmente grátis!

📥 BAIXE O APP AGORA:
👉 [LINK DO DOWNLOAD]

📖 COMO ATIVAR:
1. Baixe e instale o LK Reactor Pro
2. Abra o aplicativo
3. Cole sua chave de licença: {{licenseKey}}
4. Pronto! Comece a reativar pacientes hoje mesmo!

💬 PRECISA DE AJUDA?
WhatsApp: +5511952829271
Email: contato@lkdigital.org

Boas vendas! 🚀
Equipe LK Reactor Pro
```

7. Test the scenario
8. Activate scenario

**Scenario B: Paid Plan Email**
- Similar to above, but triggered by payment webhook
- Include payment confirmation
- Different template for PRO vs PREMIUM

---

#### **Step 2: Connect Your App to Make.com**

**For FREE Plan (Lead Submission):**

Update `app/api/analytics/track/route.ts`:

```typescript
case 'lead_completed':
  // ... existing code to save to Supabase ...

  // Generate FREE license key
  const licenseKey = generateLicenseKey();

  // Send to Make.com webhook for email automation
  await fetch(process.env.MAKE_EMAIL_WEBHOOK_FREE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      clinicName: data.clinicName,
      whatsapp: data.whatsapp,
      licenseKey: licenseKey,
      tier: 'FREE',
      downloadUrl: 'https://your-domain.com/download/LK-Reactor-Setup.exe'
    })
  });
  break;
```

**For PAID Plan (Payment Webhook):**

Update `app/api/webhooks/mercadopago/route.ts`:

```typescript
// After subscription activation (line 122)
// Send activation email via Make.com
await fetch(process.env.MAKE_EMAIL_WEBHOOK_PAID, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: clinic.name || clinic.clinic_name,
    email: clinic.email,
    licenseKey: clinic.license_key,
    tier: tier,
    billingCycle: billingCycle,
    amount: amount,
    downloadUrl: 'https://your-domain.com/download/LK-Reactor-Setup.exe',
    receiptUrl: `https://www.mercadopago.com.br/payments/${paymentId}`
  })
});
```

---

#### **Step 3: Add Environment Variables**

Add to Vercel:
```bash
MAKE_EMAIL_WEBHOOK_FREE=https://hook.make.com/your-free-plan-webhook
MAKE_EMAIL_WEBHOOK_PAID=https://hook.make.com/your-paid-plan-webhook
```

---

## **OPTION 2: SendGrid (Professional - Recommended for Scale)** ⭐⭐

**Why:** Industry-standard transactional email service

### **Pros:**
- ✅ Professional email delivery
- ✅ High deliverability rates
- ✅ FREE tier (100 emails/day)
- ✅ Templates and analytics
- ✅ Unsubscribe management
- ✅ Direct API integration

### **Cons:**
- ❌ Requires coding
- ❌ Need to verify domain (for best deliverability)

---

### **Setup Steps:**

#### **Step 1: Create SendGrid Account**
1. Go to: https://sendgrid.com/
2. Sign up for FREE account
3. Verify your email
4. Get API key: Settings → API Keys → Create API Key

#### **Step 2: Install SendGrid Package**

```bash
npm install @sendgrid/mail
```

#### **Step 3: Create Email Service**

Create `lib/email-service.ts`:

```typescript
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function sendFreeLicenseEmail(data: {
  name: string;
  email: string;
  clinicName: string;
  licenseKey: string;
  downloadUrl: string;
}) {
  const msg = {
    to: data.email,
    from: 'contato@lkdigital.org', // Must be verified in SendGrid
    subject: '🎉 Seu Acesso ao LK Reactor Pro - 14 Dias GRÁTIS!',
    html: `
      <h1>Olá ${data.name}!</h1>
      <p>Bem-vindo ao LK Reactor Pro! 🎊</p>
      
      <h2>Sua Chave de Licença:</h2>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center;">
        ${data.licenseKey}
      </div>
      
      <p>✨ Você tem <strong>14 DIAS DE ACESSO PREMIUM</strong> totalmente grátis!</p>
      
      <h3>📥 Próximos Passos:</h3>
      <ol>
        <li><a href="${data.downloadUrl}">Baixe o LK Reactor Pro</a></li>
        <li>Instale o aplicativo</li>
        <li>Cole sua chave de licença: <code>${data.licenseKey}</code></li>
        <li>Comece a reativar pacientes!</li>
      </ol>
      
      <p>💬 <strong>Precisa de Ajuda?</strong><br>
      WhatsApp: <a href="https://wa.me/5511952829271">+55 11 95282-9271</a><br>
      Email: contato@lkdigital.org</p>
      
      <p>Boas vendas! 🚀<br>
      Equipe LK Reactor Pro</p>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Free license email sent to:', data.email);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

export async function sendPaidLicenseEmail(data: {
  name: string;
  email: string;
  licenseKey: string;
  tier: string;
  amount: number;
  billingCycle: string;
  downloadUrl: string;
  receiptUrl: string;
}) {
  const msg = {
    to: data.email,
    from: 'contato@lkdigital.org',
    subject: `✅ Pagamento Confirmado - LK Reactor Pro ${data.tier}`,
    html: `
      <h1>Olá ${data.name}!</h1>
      <p>✅ Seu pagamento foi confirmado com sucesso!</p>
      
      <h2>Sua Chave de Licença ${data.tier}:</h2>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center;">
        ${data.licenseKey}
      </div>
      
      <h3>📋 Detalhes do Pedido:</h3>
      <ul>
        <li><strong>Plano:</strong> ${data.tier}</li>
        <li><strong>Ciclo:</strong> ${data.billingCycle === 'monthly' ? 'Mensal' : 'Anual'}</li>
        <li><strong>Valor:</strong> R$ ${data.amount.toFixed(2)}</li>
      </ul>
      
      <p><a href="${data.receiptUrl}">Ver Comprovante de Pagamento</a></p>
      
      <h3>📥 Próximos Passos:</h3>
      <ol>
        <li><a href="${data.downloadUrl}">Baixe o LK Reactor Pro</a></li>
        <li>Instale o aplicativo</li>
        <li>Cole sua chave de licença: <code>${data.licenseKey}</code></li>
        <li>Aproveite todas as funcionalidades ${data.tier}!</li>
      </ol>
      
      <p>💬 <strong>Suporte:</strong><br>
      WhatsApp: <a href="https://wa.me/5511952829271">+55 11 95282-9271</a><br>
      Email: contato@lkdigital.org</p>
      
      <p>Obrigado por escolher o LK Reactor Pro! 🚀<br>
      Equipe LK Reactor Pro</p>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Paid license email sent to:', data.email);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}
```

#### **Step 4: Integrate with Your API Routes**

Update `app/api/webhooks/mercadopago/route.ts`:

```typescript
import { sendPaidLicenseEmail } from '@/lib/email-service';

// After subscription activation (line 122)
try {
  await sendPaidLicenseEmail({
    name: clinic.name || clinic.clinic_name || 'Cliente',
    email: clinic.email,
    licenseKey: clinic.license_key,
    tier: tier,
    amount: amount,
    billingCycle: billingCycle,
    downloadUrl: 'https://your-domain.com/download/LK-Reactor-Setup.exe',
    receiptUrl: `https://www.mercadopago.com.br/payments/${paymentId}`
  });
} catch (emailError) {
  console.error('Failed to send email, but subscription activated:', emailError);
  // Don't fail the webhook if email fails
}
```

#### **Step 5: Add Environment Variable**

Add to Vercel:
```bash
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
```

---

## **OPTION 3: Gmail SMTP (Quick & Easy for Testing)** 🧪

**Why:** Good for testing, not recommended for production

### **Pros:**
- ✅ FREE (with limits)
- ✅ Easy to set up
- ✅ No external service needed

### **Cons:**
- ❌ Low sending limits (500/day)
- ❌ Less professional
- ❌ May end up in spam
- ❌ Requires app password

### **Not Recommended for Production!**

---

## 🎯 **RECOMMENDED APPROACH:**

### **For MVP/Launch:** 
Use **Make.com** (Option 1)
- Fastest to implement
- No coding required
- Works immediately

### **For Scale/Growth:**
Migrate to **SendGrid** (Option 2)
- Better deliverability
- More professional
- Direct integration

---

## 📋 **IMPLEMENTATION CHECKLIST:**

### **Phase 1: Make.com Setup (This Week)**
- [ ] Create Make.com scenarios for emails
- [ ] Design email templates (FREE and PAID)
- [ ] Test scenarios with sample data
- [ ] Get webhook URLs from Make.com
- [ ] Add webhook URLs to `.env.local` and Vercel
- [ ] Update `app/api/analytics/track/route.ts` for FREE plan
- [ ] Update `app/api/webhooks/mercadopago/route.ts` for PAID plan
- [ ] Test end-to-end: Submit form → Receive email
- [ ] Test payment flow → Receive email
- [ ] Deploy to production

### **Phase 2: SendGrid Migration (Later)**
- [ ] Create SendGrid account
- [ ] Verify sender domain
- [ ] Get API key
- [ ] Install `@sendgrid/mail` package
- [ ] Create `lib/email-service.ts`
- [ ] Update API routes to use SendGrid
- [ ] Test email delivery
- [ ] Monitor deliverability rates
- [ ] Disable Make.com scenarios

---

## 📧 **EMAIL TEMPLATES:**

### **Template 1: FREE Plan Welcome**

```
Subject: 🎉 Seu Acesso GRATUITO ao LK Reactor Pro está Ativo!

Olá {{name}},

Parabéns! Seu teste de 14 dias do LK Reactor Pro está ativo! 🎊

━━━━━━━━━━━━━━━━━━━━
🔑 SUA CHAVE DE LICENÇA
━━━━━━━━━━━━━━━━━━━━

{{licenseKey}}

(Copie e guarde essa chave!)

━━━━━━━━━━━━━━━━━━━━
📥 BAIXE O APLICATIVO
━━━━━━━━━━━━━━━━━━━━

👉 [CLIQUE AQUI PARA BAIXAR]

━━━━━━━━━━━━━━━━━━━━
📖 COMO ATIVAR (3 PASSOS)
━━━━━━━━━━━━━━━━━━━━

1. Baixe e instale o LK Reactor Pro
2. Abra o aplicativo
3. Cole sua chave de licença: {{licenseKey}}

Pronto! Você já pode:
✅ Reativar até 10 pacientes por dia
✅ Criar campanhas personalizadas
✅ Importar sua base de pacientes (CSV)
✅ Ver resultados em tempo real

━━━━━━━━━━━━━━━━━━━━
💬 PRECISA DE AJUDA?
━━━━━━━━━━━━━━━━━━━━

WhatsApp: +55 11 95282-9271
Email: contato@lkdigital.org

━━━━━━━━━━━━━━━━━━━━
💡 DICA PRO
━━━━━━━━━━━━━━━━━━━━

Quer reativar ILIMITADOS pacientes?
Veja nossos planos PRO e PREMIUM aqui:
👉 https://seu-dominio.com/precos

Boas vendas! 🚀
Equipe LK Reactor Pro
```

---

### **Template 2: PAID Plan Activation**

```
Subject: ✅ Pagamento Confirmado - Bem-vindo ao LK Reactor Pro {{tier}}!

Olá {{name}},

✅ Seu pagamento foi confirmado com sucesso!

Você agora tem acesso ao plano {{tier}} do LK Reactor Pro! 🎉

━━━━━━━━━━━━━━━━━━━━
🔑 SUA CHAVE DE LICENÇA {{tier}}
━━━━━━━━━━━━━━━━━━━━

{{licenseKey}}

(Copie e guarde essa chave!)

━━━━━━━━━━━━━━━━━━━━
📋 DETALHES DO SEU PEDIDO
━━━━━━━━━━━━━━━━━━━━

Plano: {{tier}}
Ciclo: {{billingCycle}}
Valor: R$ {{amount}}

🧾 [Ver Comprovante de Pagamento]

━━━━━━━━━━━━━━━━━━━━
📥 BAIXE O APLICATIVO
━━━━━━━━━━━━━━━━━━━━

👉 [CLIQUE AQUI PARA BAIXAR]

━━━━━━━━━━━━━━━━━━━━
📖 COMO ATIVAR (3 PASSOS)
━━━━━━━━━━━━━━━━━━━━

1. Baixe e instale o LK Reactor Pro
2. Abra o aplicativo
3. Cole sua chave de licença: {{licenseKey}}

━━━━━━━━━━━━━━━━━━━━
✨ O QUE VOCÊ TEM AGORA:
━━━━━━━━━━━━━━━━━━━━

{{#if isPro}}
✅ Reative até 500 pacientes por dia
✅ IA cria mensagens profissionais
✅ Campanhas personalizadas ilimitadas
✅ Painel de resultados em tempo real
✅ Suporte prioritário via WhatsApp
{{/if}}

{{#if isPremium}}
✅ Reativação ILIMITADA de pacientes
✅ IA avançada com 3 versões de mensagens
✅ 7 tipos de campanha prontos
✅ Testes A/B/C automáticos
✅ Suporte VIP via WhatsApp
{{/if}}

━━━━━━━━━━━━━━━━━━━━
💬 SUPORTE PRIORITÁRIO
━━━━━━━━━━━━━━━━━━━━

WhatsApp: +55 11 95282-9271
Email: contato@lkdigital.org

Obrigado por escolher o LK Reactor Pro! 🚀
Equipe LK Reactor Pro
```

---

## 🔒 **SECURITY CONSIDERATIONS:**

1. **Never log emails or license keys in production logs**
2. **Use environment variables for API keys**
3. **Validate email addresses before sending**
4. **Rate limit email sending** (prevent abuse)
5. **Track email bounces** and remove invalid addresses
6. **Include unsubscribe link** (for marketing emails)
7. **Use authenticated SMTP** (SPF, DKIM, DMARC)

---

## 📊 **ANALYTICS TO TRACK:**

- Email open rate
- Email click rate (download link)
- License activation rate (how many actually use the key)
- Time from email to first app login
- Email bounce rate
- Unsubscribe rate

---

## 🎯 **NEXT STEPS:**

1. **Choose your approach** (Make.com for speed, SendGrid for scale)
2. **Set up email templates** (use templates above as starting point)
3. **Configure webhooks** or **install packages**
4. **Update API routes** to send emails
5. **Test thoroughly** with real email addresses
6. **Deploy to production**
7. **Monitor email deliverability**

---

## 🆘 **NEED HELP?**

Let me know which option you want to implement, and I'll:
- Create the complete code
- Update your API routes
- Set up the email templates
- Test the integration
- Deploy to production

**Recommended:** Start with Make.com (Option 1) for fastest implementation!
