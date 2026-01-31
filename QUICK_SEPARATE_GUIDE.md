# ⚡ Quick Guide: Separate the Repositories

## 🎯 Goal

You have **LK Lead Outreach** code in the **lk-reactor-pro** repository. You want them separate.

## ✅ Solution: Create New Repo for LK Lead Outreach

### Step 1: Create New GitHub Repository

1. Go to: https://github.com/new
2. **Repository name:** `lk-lead-outreach`
3. **Description:** "LK Lead Outreach - B2B Lead Outreach Automation Tool"
4. **Visibility:** Private
5. **DO NOT** check any initialization options
6. Click **"Create repository"**

### Step 2: Push Current Code to New Repo

Run these commands:

```powershell
# Add new remote
git remote add lead-outreach https://github.com/K-Skills17/lk-lead-outreach.git

# Push current code (LK Lead Outreach)
git push lead-outreach main

# Verify
git remote -v
```

### Step 3: (Optional) Restore LK Reactor Pro

If you need to restore the `lk-reactor-pro` repository to its original state:

```powershell
# First, create a backup
git branch backup-lk-lead-outreach

# Restore main to last LK Reactor Pro commit
git checkout main
git reset --hard 7eee6c6

# Force push to GitHub (⚠️ CAREFUL!)
git push origin main --force
```

**⚠️ Warning:** Force push will overwrite the GitHub repository. Make sure you've pushed LK Lead Outreach to the new repo first!

---

## 🚀 Or Use the Script

I've created `separate-repos.ps1` - run it:

```powershell
.\separate-repos.ps1
```

It will guide you through the process step by step.

---

## 📋 What Happens

**Before:**
- `lk-reactor-pro` repo → Contains LK Lead Outreach code ❌

**After:**
- `lk-lead-outreach` repo → Contains LK Lead Outreach code ✅
- `lk-reactor-pro` repo → Contains LK Reactor Pro code ✅ (if restored)

---

## ✅ Checklist

- [ ] Create `lk-lead-outreach` repository on GitHub
- [ ] Add remote: `git remote add lead-outreach <url>`
- [ ] Push code: `git push lead-outreach main`
- [ ] Verify new repo has correct code
- [ ] (Optional) Restore `lk-reactor-pro` to commit `7eee6c6`
- [ ] Update Vercel/deployment configs
- [ ] Update documentation with new repo URLs

---

**Ready?** Run the script or follow the manual steps above!
