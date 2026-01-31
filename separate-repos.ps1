# PowerShell Script to Separate LK Reactor Pro and LK Lead Outreach

Write-Host "=== Separating LK Reactor Pro and LK Lead Outreach ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current state
Write-Host "Step 1: Checking current repository state..." -ForegroundColor Yellow
git remote -v
Write-Host ""

# Step 2: Create new remote for LK Lead Outreach
Write-Host "Step 2: Adding new remote for LK Lead Outreach..." -ForegroundColor Yellow
Write-Host "Please create the repository 'lk-lead-outreach' on GitHub first!" -ForegroundColor Red
Write-Host "Then press Enter to continue..." -ForegroundColor Yellow
Read-Host

$newRepoUrl = Read-Host "Enter the new repository URL (e.g., https://github.com/K-Skills17/lk-lead-outreach.git)"

if ($newRepoUrl) {
    git remote add lead-outreach $newRepoUrl
    Write-Host "✓ Added remote: lead-outreach" -ForegroundColor Green
} else {
    Write-Host "✗ No URL provided. Exiting." -ForegroundColor Red
    exit
}

Write-Host ""

# Step 3: Push current code to new repo
Write-Host "Step 3: Pushing LK Lead Outreach code to new repository..." -ForegroundColor Yellow
git push lead-outreach main
Write-Host "✓ Pushed to lk-lead-outreach" -ForegroundColor Green
Write-Host ""

# Step 4: Show remotes
Write-Host "Step 4: Current remotes:" -ForegroundColor Yellow
git remote -v
Write-Host ""

# Step 5: Ask about restoring LK Reactor Pro
Write-Host "Step 5: Restore LK Reactor Pro?" -ForegroundColor Yellow
Write-Host "The last LK Reactor Pro commit appears to be: 7eee6c6" -ForegroundColor Cyan
$restore = Read-Host "Do you want to restore lk-reactor-pro repo to that state? (y/n)"

if ($restore -eq "y") {
    Write-Host ""
    Write-Host "⚠️  WARNING: This will reset the origin/main branch!" -ForegroundColor Red
    Write-Host "Make sure you've pushed LK Lead Outreach to the new repo first!" -ForegroundColor Red
    $confirm = Read-Host "Type 'yes' to confirm"
    
    if ($confirm -eq "yes") {
        # Create backup branch first
        Write-Host "Creating backup branch..." -ForegroundColor Yellow
        git branch backup-lk-lead-outreach
        
        # Restore main to LK Reactor Pro state
        Write-Host "Restoring main to LK Reactor Pro state..." -ForegroundColor Yellow
        git checkout main
        git reset --hard 7eee6c6
        
        Write-Host ""
        Write-Host "✓ Restored main to LK Reactor Pro state" -ForegroundColor Green
        Write-Host "⚠️  You need to force push to update GitHub:" -ForegroundColor Yellow
        Write-Host "   git push origin main --force" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⚠️  BE CAREFUL with force push!" -ForegroundColor Red
    } else {
        Write-Host "Restore cancelled." -ForegroundColor Yellow
    }
} else {
    Write-Host "Skipping restore. LK Reactor Pro repo will keep current state." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "- LK Lead Outreach: Pushed to 'lead-outreach' remote" -ForegroundColor Green
Write-Host "- LK Reactor Pro: Check origin remote status" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify new repository on GitHub" -ForegroundColor White
Write-Host "2. Update Vercel/deployment to point to new repo (if needed)" -ForegroundColor White
Write-Host "3. Update any documentation with new repo URLs" -ForegroundColor White
