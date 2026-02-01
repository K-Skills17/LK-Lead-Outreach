# Create Admin User Script
# This script helps you create an admin user for the dashboard

param(
    [Parameter(Mandatory=$false)]
    [string]$Email = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Password = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Name = "Admin"
)

Write-Host "`n🔐 Admin User Creation Script" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# Get email if not provided
if (-not $Email) {
    $Email = Read-Host "Enter admin email"
}

# Get password if not provided
if (-not $Password) {
    $securePassword = Read-Host "Enter admin password" -AsSecureString
    $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    )
    
    $confirmPassword = Read-Host "Confirm password" -AsSecureString
    $confirmPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmPassword)
    )
    
    if ($Password -ne $confirmPasswordPlain) {
        Write-Host "`n❌ Passwords don't match!" -ForegroundColor Red
        exit 1
    }
}

# Get name if not provided
if (-not $Name -or $Name -eq "Admin") {
    $Name = Read-Host "Enter admin name (or press Enter for 'Admin')"
    if (-not $Name) {
        $Name = "Admin"
    }
}

Write-Host "`n📋 Admin Details:" -ForegroundColor Cyan
Write-Host "   Email: $Email" -ForegroundColor Gray
Write-Host "   Name: $Name" -ForegroundColor Gray
Write-Host "   Password: [hidden]" -ForegroundColor Gray

# Check if we can use the setup API
$setupToken = ""
if (Test-Path .env.local) {
    $envContent = Get-Content .env.local
    $tokenLine = $envContent | Select-String "ADMIN_SETUP_TOKEN"
    if ($tokenLine) {
        $setupToken = ($tokenLine -split "=")[1].Trim()
    }
}

if ($setupToken) {
    Write-Host "`n🚀 Using API setup method..." -ForegroundColor Cyan
    
    $url = "http://localhost:3000/api/admin/setup"
    $body = @{
        setupToken = $setupToken
        email = $Email
        password = $Password
        name = $Name
    } | ConvertTo-Json
    
    try {
        $result = Invoke-RestMethod -Uri $url -Method Post -Headers @{
            "Content-Type" = "application/json"
        } -Body $body -ErrorAction Stop
        
        if ($result.success) {
            Write-Host "`n✅ Admin user created successfully!" -ForegroundColor Green
            Write-Host "`n📝 Login Credentials:" -ForegroundColor Cyan
            Write-Host "   Email: $Email" -ForegroundColor Gray
            Write-Host "   Password: [the password you entered]" -ForegroundColor Gray
            Write-Host "`n💡 Access the admin dashboard at: http://localhost:3000/admin" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "`n❌ API setup failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Response: $responseBody" -ForegroundColor Yellow
        }
        Write-Host "`n💡 Falling back to SQL method..." -ForegroundColor Yellow
        $setupToken = "" # Force SQL method
    }
}

# If API method didn't work, provide SQL
if (-not $setupToken) {
    Write-Host "`n📝 SQL Method (Manual Setup)" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Gray
    Write-Host "`n1. Generate password hash using Node.js:" -ForegroundColor Yellow
    Write-Host "   Run this command:" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   node -e `"const bcrypt = require('bcryptjs'); bcrypt.hash('$Password', 10).then(h => console.log(h));`"" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Copy the hash and run this SQL in Supabase:" -ForegroundColor Yellow
    Write-Host ""
    
    $sql = @"
-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy (if not exists)
DO `$`$`$`
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_users' 
    AND policyname = 'Service role can manage admin_users'
  ) THEN
    CREATE POLICY "Service role can manage admin_users" ON admin_users FOR ALL USING (true);
  END IF;
END`$`$`$`;

-- Create index (if not exists)
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Insert or update admin user
-- Replace 'YOUR_PASSWORD_HASH_HERE' with the hash from step 1
INSERT INTO admin_users (email, password_hash, name)
VALUES (
  '$Email',
  'YOUR_PASSWORD_HASH_HERE',  -- Replace this!
  '$Name'
)
ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name;
"@
    
    Write-Host $sql -ForegroundColor White
    Write-Host ""
    Write-Host "3. After running SQL, login at: http://localhost:3000/admin" -ForegroundColor Yellow
    Write-Host "   Email: $Email" -ForegroundColor Gray
    Write-Host "   Password: [the password you entered]" -ForegroundColor Gray
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
