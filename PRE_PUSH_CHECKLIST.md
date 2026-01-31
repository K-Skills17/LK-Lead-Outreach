# ✅ Pre-Push Checklist for LK Lead Outreach

## 📋 Project Type
✅ **Next.js 16.1.6** project with:
- TypeScript
- App Router (`app/` directory)
- Tailwind CSS
- Supabase integration

## 🔒 Security Check

### ✅ Environment Files (CRITICAL!)
- [x] `.env.local` is in `.gitignore` (line 34: `.env*`)
- [x] `.env.local` does NOT exist in repository
- [ ] Verify no API keys are hardcoded in source files
- [ ] Verify no database credentials in code

### ✅ Sensitive Data
- [ ] No Supabase service role keys in code
- [ ] No OpenAI API keys in code
- [ ] No Resend API keys in code
- [ ] No integration tokens in code

## 📁 Files to Commit

### ✅ Should be committed:
- ✅ `package.json` & `package-lock.json`
- ✅ `next.config.ts`
- ✅ `tsconfig.json`
- ✅ `vercel.json`
- ✅ `app/` directory (all source code)
- ✅ `components/` directory
- ✅ `lib/` directory
- ✅ `supabase/migrations/` (database migrations)
- ✅ `public/` directory (static assets)
- ✅ `.gitignore`
- ✅ `README.md`
- ✅ Documentation files (`.md` files)

### ❌ Should NOT be committed:
- ❌ `.env.local` (contains secrets)
- ❌ `.env` (any env files)
- ❌ `node_modules/` (install with `npm install`)
- ❌ `.next/` (build output)
- ❌ `.vercel/` (deployment config)
- ❌ `*.tsbuildinfo`
- ❌ `next-env.d.ts`

## 🚀 Before Pushing

### 1. Initialize Git (if not done)
```powershell
git init
git add .
git commit -m "Initial commit - LK Lead Outreach"
```

### 2. Add Remote
```powershell
# For new repository
git remote add origin https://github.com/K-Skills17/lk-lead-outreach.git

# Or if separating from lk-reactor-pro
git remote add lead-outreach https://github.com/K-Skills17/lk-lead-outreach.git
```

### 3. Verify What Will Be Pushed
```powershell
# Check what's staged
git status

# Verify .env.local is NOT in the list
git status | Select-String "\.env"
```

### 4. Push
```powershell
git push -u origin main
# or
git push -u lead-outreach main
```

## ⚠️ Important Notes

1. **Never commit `.env.local`** - It contains:
   - Supabase keys
   - OpenAI API key
   - Resend API key
   - Integration tokens
   - Other secrets

2. **Documentation files** - All `.md` files are fine to commit (they're documentation)

3. **Database migrations** - `supabase/migrations/` should be committed (they're version-controlled SQL)

4. **Build files** - `.next/` and `node_modules/` are auto-generated, don't commit

## 🔍 Quick Verification

Run this to check for any accidentally staged secrets:

```powershell
# Check if any .env files are staged
git status --short | Select-String "\.env"

# Should return nothing! If it shows .env files, unstage them:
# git reset HEAD .env.local
```

## ✅ Final Checklist

- [ ] Git repository initialized
- [ ] `.env.local` is NOT in git status
- [ ] All source code is staged
- [ ] Remote repository created on GitHub
- [ ] Remote added to local git
- [ ] Ready to push!

---

**Ready to push?** Run:
```powershell
git status  # Verify
git push -u origin main  # Push
```
