# 🔧 Fix PowerShell Execution Policy Error

## The Problem

When you run `.\script.ps1`, you get an error like:
```
.\script.ps1 : File cannot be loaded because running scripts is disabled on this system.
```

This is because PowerShell's execution policy is blocking script execution.

---

## ✅ **Quick Fix (Recommended)**

Run this command in PowerShell **as Administrator**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**What this does:**
- Allows you to run local scripts (like `.ps1` files in your project)
- Still blocks unsigned scripts from the internet (for security)
- Only affects your user account (not system-wide)

---

## 🔍 **Check Current Policy**

To see your current execution policy:

```powershell
Get-ExecutionPolicy -List
```

You'll see something like:
```
        Scope ExecutionPolicy
        ----- ---------------
MachinePolicy       Undefined
   UserPolicy       Undefined
      Process       Undefined
  CurrentUser       Undefined
 LocalMachine    Restricted
```

---

## 📋 **Different Fix Options**

### Option 1: RemoteSigned (Recommended)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
- ✅ Allows local scripts
- ✅ Blocks unsigned internet scripts
- ✅ Safe and recommended

### Option 2: Bypass (Temporary - Less Secure)
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```
- ✅ Works immediately
- ⚠️ Only for current PowerShell session
- ⚠️ Less secure (allows all scripts)

### Option 3: Unrestricted (Not Recommended)
```powershell
Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope CurrentUser
```
- ⚠️ Allows all scripts (less secure)
- ⚠️ Not recommended for security reasons

---

## 🚀 **After Fixing**

Once you set the policy, you can run scripts normally:

```powershell
.\check-env-structure.ps1
.\test-admin-login-simple.ps1 -Email "test@example.com" -Password "test"
.\diagnose-admin-login.ps1 -Email "test@example.com" -Password "test"
```

---

## 🔒 **Security Note**

The `RemoteSigned` policy is safe because:
- It allows scripts you create locally
- It blocks unsigned scripts downloaded from the internet
- It only affects your user account, not the whole system

---

## ❓ **If You Can't Change Policy**

If you don't have admin rights or can't change the policy:

### Alternative: Run Script Content Directly

You can copy the script content and run it in PowerShell:

```powershell
# Instead of: .\check-env-structure.ps1
# Copy the script content and paste it directly
```

### Alternative: Use PowerShell ISE

PowerShell ISE might have different execution policy settings.

---

## 🧪 **Test It Works**

After setting the policy, test with a simple script:

```powershell
# Create a test file
@"
Write-Host "Test script works!" -ForegroundColor Green
"@ | Out-File -FilePath "test.ps1" -Encoding utf8

# Run it
.\test.ps1

# Should output: "Test script works!"
```

---

## 📞 **Still Having Issues?**

If you still get errors after setting the policy:

1. **Make sure you ran PowerShell as Administrator**
2. **Check the error message** - it might be a different issue
3. **Try the Bypass option** for the current session:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   ```

---

**Last Updated:** 2025-01-12
