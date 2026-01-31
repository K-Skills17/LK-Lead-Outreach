# 🚀 LK Lead Outreach

Professional B2B lead outreach automation tool with AI-powered message generation, email sending, and WhatsApp follow-ups.

## ✨ Features

- 📊 **CSV Import** - Import leads with enrichment data (nome, empresa, cargo, site, dor_especifica)
- 🤖 **AI Message Generation** - GPT-4 powered personalized messages using all lead data
- 📧 **Email Automation** - Send initial emails via Resend
- 💬 **WhatsApp Follow-ups** - Queue and send WhatsApp messages
- 👥 **SDR Accounts** - Multi-user support with login and dashboard
- 🔗 **Lead Gen Integration** - Seamless integration with your lead generation tool
- 📈 **Campaign Management** - Organize and track outreach campaigns

## 🚀 Quick Start

### Local Development

1. **Clone repository:**
```bash
git clone https://github.com/yourusername/lk-lead-outreach.git
cd lk-lead-outreach
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment:**
```bash
# Copy template
cp COPY_TO_ENV_LOCAL.txt .env.local

# Edit .env.local and add your credentials
```

4. **Run database migrations:**
- Go to Supabase Dashboard → SQL Editor
- Run: `supabase/migrations/000_complete_setup.sql`

5. **Start development server:**
```bash
npm run dev
```

6. **Open browser:**
```
http://localhost:3000/dashboard
```

## 📚 Documentation

- **Local Setup:** `LOCAL_SETUP_GUIDE.md`
- **CSV Import:** `LOCAL_CSV_IMPORT_SETUP.md`
- **SDR Accounts:** `SDR_ACCOUNTS_SETUP.md`
- **Lead Gen Integration:** `LEAD_GEN_INTEGRATION_GUIDE.md`
- **Vercel Deployment:** `VERCEL_DEPLOYMENT_GUIDE.md`
- **Quick Deploy:** `QUICK_VERCEL_DEPLOY.md`

## 🔗 Integration

### Lead Generation Tool Integration

**API Endpoint:**
```
POST /api/integration/leads/receive
Authorization: Bearer YOUR_INTEGRATION_TOKEN
```

**Webhook:**
```
POST /api/integration/webhook
```

See `LEAD_GEN_INTEGRATION_GUIDE.md` for complete integration guide.

## 🛠️ Tech Stack

- **Framework:** Next.js 16
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **AI:** OpenAI GPT-4o-mini
- **Email:** Resend
- **Deployment:** Vercel

## 📋 Environment Variables

See `COPY_TO_ENV_LOCAL.txt` for complete list.

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Recommended:**
- `OPENAI_API_KEY`
- `SENDER_SERVICE_TOKEN`
- `RESEND_API_KEY`
- `LEAD_GEN_INTEGRATION_TOKEN`

## 🚀 Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import repository
4. Add environment variables
5. Deploy!

See `VERCEL_DEPLOYMENT_GUIDE.md` for detailed instructions.

## 📖 API Endpoints

- `POST /api/integration/leads/receive` - Receive enriched leads
- `POST /api/integration/webhook` - Webhook events
- `GET /api/integration/status` - Integration status
- `POST /api/sdr/login` - SDR login
- `GET /api/sdr/dashboard` - SDR dashboard data
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/[id]/import-csv` - Import CSV
- `POST /api/campaigns/[id]/leads/[leadId]/generate-message` - Generate AI message

## 🤝 Contributing

This is an internal tool. For questions or issues, contact the development team.

## 📄 License

Internal use only.

---

**Built with ❤️ by LK Digital**
