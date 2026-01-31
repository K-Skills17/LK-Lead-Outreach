# 🖥️ Local Development Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **Git** (if cloning from repository)
   - Download from: https://git-scm.com/

3. **Supabase Account**
   - Sign up at: https://supabase.com/
   - Create a project (or use existing one)

## Step 1: Install Dependencies

```bash
# Navigate to project directory
cd "C:\dev\LK Lead Outreach"

# Install all dependencies
npm install
```

## Step 2: Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Copy from .env.example if it exists, or create new file
```

Add these variables:

```env
# ============================================
# SUPABASE (Use your existing project)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ============================================
# OPTIONAL - For full features
# ============================================
OPENAI_API_KEY=sk-your_openai_key_here
SENDER_SERVICE_TOKEN=your_secure_token_here

# ============================================
# OPTIONAL - Payment (if needed)
# ============================================
NEXT_PUBLIC_PRO_SUBSCRIBTION=https://...
NEXT_PUBLIC_PREMIUM_SUBSCRIBTION=https://...
```

## Step 3: Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run these migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/003_analytics_tracking.sql`
   - `supabase/migrations/008_update_lead_outreach_schema.sql`
   - `supabase/migrations/009_enrichment_tool_integration.sql` (update table name if needed)

## Step 4: Start Development Server

```bash
# Start the Next.js development server
npm run dev
```

The app will be available at: **http://localhost:3000**

## Step 5: Verify Setup

1. Open browser: http://localhost:3000
2. You should see the landing page
3. Check console for any errors

## 🔄 Using Same Supabase Project

### Yes, you can use the same Supabase project!

**Benefits:**
- ✅ Single database for all your tools
- ✅ Shared data between enrichment and outreach tools
- ✅ Easier management and monitoring
- ✅ Lower costs (one project instead of two)

**Important Notes:**
1. **Table Names**: Make sure your enrichment tool's table doesn't conflict with outreach tool tables:
   - Outreach tool uses: `campaigns`, `campaign_contacts`, `clinics`, etc.
   - Update the view in `009_enrichment_tool_integration.sql` to point to your enrichment table

2. **Permissions**: Both tools can use the same Supabase keys:
   - `NEXT_PUBLIC_SUPABASE_URL` - Same for both
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Same for both
   - `SUPABASE_SERVICE_ROLE_KEY` - Same for both (keep secure!)

## 🔗 Automatic Lead Transfer

### Option 1: API Endpoint (Recommended)

Your enrichment tool can call this endpoint to send leads:

```typescript
// Example: Send leads from enrichment tool
const response = await fetch('http://localhost:3000/api/enrichment/import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    licenseKey: 'YOUR_LICENSE_KEY',
    campaignId: 'CAMPAIGN_UUID',
    leads: [
      {
        nome: 'João Silva',
        empresa: 'Empresa ABC',
        cargo: 'CEO',
        site: 'https://empresaabc.com.br',
        dor_especifica: 'Necessita aumentar vendas',
        phone: '+5511999999999',
        email: 'joao@empresaabc.com.br'
      }
    ]
  })
});

const result = await response.json();
console.log(`Imported: ${result.imported}, Skipped: ${result.skipped}`);
```

### Option 2: Database Function

Use the sync function directly in your enrichment tool:

```sql
-- Sync up to 100 leads to a campaign
SELECT * FROM sync_enriched_leads_to_campaign(
  'your-campaign-id-here'::UUID,
  100
);
```

### Option 3: Scheduled Sync

Set up a cron job or scheduled task to automatically sync:

```bash
# Example: Sync every hour
# Add to your enrichment tool's scheduler
curl -X POST http://localhost:3000/api/enrichment/sync \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "YOUR_LICENSE_KEY",
    "campaignId": "CAMPAIGN_UUID",
    "limit": 100
  }'
```

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
PORT=3001 npm run dev
```

### Database Connection Errors
- Verify Supabase URL and keys are correct
- Check if migrations have been run
- Ensure RLS policies allow access (or use service-role key)

### Module Not Found Errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 Development Workflow

1. **Make changes** to code
2. **Save file** - Next.js auto-reloads
3. **Check browser** - Changes appear automatically
4. **Check console** - For errors and logs

## 🚀 Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📚 Additional Resources

- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- TypeScript Docs: https://www.typescriptlang.org/docs
