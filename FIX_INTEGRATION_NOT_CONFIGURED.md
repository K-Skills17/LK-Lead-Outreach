# 🔧 Fix "Integration not configured" Error

## Problem
The error "Integration not configured" means `LEAD_GEN_INTEGRATION_TOKEN` is not being read by Next.js.

---

## ✅ Solution Steps

### Step 1: Verify .env.local File

Make sure your `.env.local` file exists and has the token:

```env
LEAD_GEN_INTEGRATION_TOKEN=bc055773c3cf2412a0a1c7483b7e0bf6
```

**Important:**
- ✅ No spaces around the `=`
- ✅ No quotes around the value
- ✅ File is in the project root (same folder as `package.json`)

---

### Step 2: Restart Dev Server

**Next.js only reads `.env.local` when it starts!**

1. **Stop the dev server** (Ctrl+C in the terminal where it's running)
2. **Start it again:**
   ```powershell
   npm run dev
   ```

---

### Step 3: Verify It's Loaded

After restarting, check if the variable is loaded:

**Option A: Add a test endpoint** (temporary)
Create `app/api/test-env/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    tokenExists: !!process.env.LEAD_GEN_INTEGRATION_TOKEN,
    tokenLength: process.env.LEAD_GEN_INTEGRATION_TOKEN?.length || 0,
    // Don't return the actual token for security!
  });
}
```

Then visit: `http://localhost:3000/api/test-env`

**Option B: Check server logs**
When you start `npm run dev`, Next.js should show:
```
✓ Loaded env from .env.local
```

---

### Step 4: Test Again

After restarting, test the integration:

```powershell
.\test-integration.ps1
```

---

## 🚨 Common Issues

### Issue 1: File Not in Root
**Problem:** `.env.local` is in wrong location

**Fix:** Make sure it's here:
```
LK-Lead-Outreach/
  ├── .env.local          ← HERE
  ├── package.json
  ├── app/
  └── ...
```

### Issue 2: Wrong Format
**Problem:** Token has quotes or spaces

**Wrong:**
```env
LEAD_GEN_INTEGRATION_TOKEN="bc055773c3cf2412a0a1c7483b7e0bf6"
LEAD_GEN_INTEGRATION_TOKEN = bc055773c3cf2412a0a1c7483b7e0bf6
```

**Correct:**
```env
LEAD_GEN_INTEGRATION_TOKEN=bc055773c3cf2412a0a1c7483b7e0bf6
```

### Issue 3: Server Not Restarted
**Problem:** Added token but didn't restart

**Fix:** Always restart after changing `.env.local`

### Issue 4: Multiple .env Files
**Problem:** Have both `.env` and `.env.local`

**Fix:** Use `.env.local` (it takes priority)

---

## 🧪 Quick Test

Run this to verify your setup:

```powershell
# Check if file exists
Test-Path .env.local

# Check if token is in file
Get-Content .env.local | Select-String "LEAD_GEN_INTEGRATION_TOKEN"

# Check format (should be: KEY=value with no spaces)
Get-Content .env.local | Select-String "LEAD_GEN_INTEGRATION_TOKEN" | ForEach-Object {
    if ($_ -match '^\s*LEAD_GEN_INTEGRATION_TOKEN\s*=\s*([^\s]+)') {
        Write-Host "✅ Format looks correct" -ForegroundColor Green
        Write-Host "   Token length: $($matches[1].Length)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Format issue detected" -ForegroundColor Red
    }
}
```

---

## 📋 Checklist

- [ ] `.env.local` file exists in project root
- [ ] `LEAD_GEN_INTEGRATION_TOKEN=your_token` is in the file
- [ ] No spaces around `=`
- [ ] No quotes around token value
- [ ] Dev server was restarted after adding token
- [ ] Server logs show "Loaded env from .env.local"

---

## 🔄 Still Not Working?

If it still doesn't work after restarting:

1. **Check Next.js version** - Make sure you're using Next.js 13+ (supports .env.local)
2. **Check file encoding** - Should be UTF-8
3. **Try .env instead** - As a test, rename `.env.local` to `.env` (then rename back)
4. **Check for typos** - Variable name must be exactly: `LEAD_GEN_INTEGRATION_TOKEN`

---

**After fixing, restart the dev server and test again!**
