# 🗺️ LK Reactor Pro - Routing Map

## Public Pages

| Route | Purpose | Key Features |
|-------|---------|-------------|
| `/` | Landing page with ROI calculator | Wizard form, value calculation, CTA to pricing |
| `/precos` | Pricing tiers ($0, $197, $497) | 3 plans, payment buttons, feature comparison |
| `/setup` | Download & installation guide | App download, setup instructions |

## Thank You Pages (Post-Purchase)

| Route | Trigger | Content |
|-------|---------|---------|
| `/obrigado` | General thank you | Generic success message |
| `/obrigado-67` | $67 purchase (DEPRECATED) | 7-day trial + download |
| `/obrigado-pro` | $197 or $497 purchase | Subscription active + download |
| `/obrigado-assinatura` | Subscription purchase | Subscription confirmation |

## Payment Status Pages

| Route | Purpose | Actions |
|-------|---------|---------|
| `/pagamento-pendente` | Payment processing | Wait message, email info |
| `/pagamento-falhou` | Payment failed | Retry button, support contact |

## API Routes

### Authentication
- `GET /api/auth/verify-license` - Verify license key validity

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/[id]/ai-generate` - Generate AI messages
- `GET /api/campaigns/[id]/drafts` - Get draft messages
- `POST /api/campaigns/[id]/import-csv` - Import contacts

### Contacts
- `POST /api/contacts/block` - Block contact from future campaigns

### Sender (Desktop App Integration)
- `GET /api/sender/queue` - Get pending messages queue
- `POST /api/sender/mark-sent` - Mark message as sent
- `POST /api/sender/mark-failed` - Mark message as failed

### Diagnostics
- `POST /api/submit-diagnostic` - Submit diagnostic info

---

## User Flow Diagrams

### New Customer Flow
```
1. Land on / (Calculator) 
   ↓ Click "Começar Agora"
2. Navigate to /precos
   ↓ Click plan button (e.g., "Ativar Professional")
3. Redirect to Mercado Pago (external)
   ↓
4. Payment processed
   ↓
5a. Success → /obrigado-pro
5b. Pending → /pagamento-pendente
5c. Failed → /pagamento-falhou
   ↓
6. Receive email with license key
   ↓
7. Visit /setup
   ↓
8. Download app, enter license
```

### Existing Customer Flow
```
1. Open desktop app
   ↓
2. App calls /api/auth/verify-license
   ↓
3a. Valid → App dashboard
3b. Invalid → Show purchase link → /precos
```

### Campaign Flow (Desktop App)
```
1. Create campaign in web dashboard
   ↓
2. Desktop app calls /api/sender/queue
   ↓
3. App sends messages via WhatsApp Web
   ↓
4. App calls /api/sender/mark-sent for each success
   or /api/sender/mark-failed for errors
   ↓
5. Web dashboard shows real-time status
```

---

## Navigation Links

### Header (Navbar)
- Logo → `/`
- Preços → `/precos`
- Download → `/setup`
- Começar Agora (CTA) → `/precos`

### Footer (on landing page)
- Logo → `/`
- Sobre → `#` (not implemented)
- Preços → `/precos`
- Contato → WhatsApp link

---

## Payment Integration Points

### Mercado Pago Configuration

#### Plan: Professional ($197)
- **Button Location**: `/precos` → "Ativar Professional"
- **Payment Link**: `NEXT_PUBLIC_PRO_PAYMENT_URL` (env variable)
- **Success URL**: `https://yourdomain.com/obrigado-pro`
- **Pending URL**: `https://yourdomain.com/pagamento-pendente`
- **Failure URL**: `https://yourdomain.com/pagamento-falhou`

#### Plan: Premium ($497)
- **Button Location**: `/precos` → "Ativar Premium"
- **Payment Link**: `NEXT_PUBLIC_PREMIUM_PAYMENT_URL` (env variable)
- **Success URL**: `https://yourdomain.com/obrigado-pro`
- **Pending URL**: `https://yourdomain.com/pagamento-pendente`
- **Failure URL**: `https://yourdomain.com/pagamento-falhou`

#### Plan: Free ($0)
- **Button Location**: `/precos` → "Começar Grátis"
- **Action**: Navigate to `/setup` (no payment)

---

## Required Environment Variables

```bash
# Payment Links (get from Mercado Pago)
NEXT_PUBLIC_PRO_PAYMENT_URL=https://mpago.la/YOUR_PRO_LINK
NEXT_PUBLIC_PREMIUM_PAYMENT_URL=https://mpago.la/YOUR_PREMIUM_LINK

# API Authentication
SENDER_SERVICE_TOKEN=your_secure_random_token

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (for AI features)
OPENAI_API_KEY=sk-...
```

---

## External Links to Update

### Support Contact
Update WhatsApp number in:
- `/app/pagamento-falhou/page.tsx` (line 136)
- `/app/pagamento-pendente/page.tsx` (line 132)

Current: `5511999999999`  
Change to: Your actual support WhatsApp

### Social Media
Add links in footer if needed:
- Instagram
- Facebook
- LinkedIn

---

## Redirects & Error Handling

### 404 Page
Create `app/not-found.tsx` for better UX (optional)

### Error Boundaries
Consider adding error boundaries for:
- Payment failures
- API errors
- Network issues

---

## SEO & Metadata

### Current Meta Tags (from layout.tsx)
- **Title**: "LK Reactor Pro - Recupere Pacientes no WhatsApp"
- **Description**: "Transforme contatos inativos em consultas reais..."
- **Language**: `pt-BR`
- **OG Image**: `/lk-reactor-logo.png`

### Recommended Additions
- Sitemap.xml
- Robots.txt
- Schema markup for pricing
- Structured data for services

---

## Performance Notes

### Images
- [x] Logo optimized
- [ ] Consider adding WebP versions
- [ ] Lazy load images below fold

### Code Splitting
- [x] Next.js handles automatically
- [x] Client components marked with 'use client'

### Caching
- Configure cache headers in production
- Consider CDN for static assets

---

## Security Headers

Add in `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
      ],
    },
  ];
},
```

---

**All routes configured and ready for launch! 🚀**
