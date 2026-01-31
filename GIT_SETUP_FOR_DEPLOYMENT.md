# 🔧 Git Setup for Vercel Deployment

## ⚠️ Common Error Fixed

**Error you saw:**
```bash
git commit -m initial commit - LK Lead Outreach
# Error: pathspec 'commit' did not match any file(s)
```

**Problem:** Commit message with spaces needs quotes!

**Correct command:**
```bash
git commit -m "Initial commit - LK Lead Outreach"
```

## ✅ Complete Git Setup

### Step 1: Initialize Git (if not done)

```bash
git init
```

### Step 2: Add All Files

```bash
git add .
```

### Step 3: Commit

```bash
git commit -m "Initial commit - LK Lead Outreach"
```

**Note:** Always use quotes around commit messages with spaces!

### Step 4: Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `lk-lead-outreach`
3. Description: "LK Lead Outreach - B2B Lead Outreach Tool"
4. Choose: **Private** (for internal tool)
5. **Don't** initialize with README (we already have one)
6. Click **"Create repository"**

### Step 5: Connect and Push

```bash
# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/lk-lead-outreach.git

# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

## 🚀 Then Deploy to Vercel

After pushing to GitHub:

1. Go to: https://vercel.com
2. Import your GitHub repository
3. Deploy!

See `VERCEL_DEPLOYMENT_GUIDE.md` for complete deployment steps.

## 💡 Git Best Practices

### Commit Messages

**✅ Good:**
```bash
git commit -m "Add SDR login page"
git commit -m "Fix integration API endpoint"
git commit -m "Update database migration"
```

**❌ Bad:**
```bash
git commit -m initial commit  # Missing quotes
git commit -m fix bug          # Missing quotes
```

### Always Quote Commit Messages

If your message has:
- Spaces
- Special characters
- Multiple words

**Always use quotes!**

## 📋 Quick Reference

```bash
# Check status
git status

# Add files
git add .

# Commit (with quotes!)
git commit -m "Your commit message here"

# Push
git push origin main
```

---

**Now you can deploy to Vercel!** 🚀
