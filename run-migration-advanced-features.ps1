# Run Advanced Features Migration
# This script helps you run the database migration for the new features

Write-Host "`n🔧 Advanced Features Migration" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n📋 This migration will create:" -ForegroundColor Yellow
Write-Host "   1. lead_personalization table" -ForegroundColor Gray
Write-Host "   2. optimal_send_times table" -ForegroundColor Gray
Write-Host "   3. send_time_analytics table" -ForegroundColor Gray
Write-Host "   4. ab_test_campaigns table" -ForegroundColor Gray
Write-Host "   5. ab_test_assignments table" -ForegroundColor Gray
Write-Host "   6. ab_test_events table" -ForegroundColor Gray
Write-Host "   7. ab_test_results view" -ForegroundColor Gray
Write-Host "   8. Helper functions and RLS policies" -ForegroundColor Gray

Write-Host "`n📍 Migration file:" -ForegroundColor Cyan
Write-Host "   supabase/migrations/002_advanced_features.sql" -ForegroundColor White

Write-Host "`n⚠️  IMPORTANT: You need to run this in Supabase SQL Editor" -ForegroundColor Yellow
Write-Host "`n📝 Steps to run:" -ForegroundColor Cyan
Write-Host "   1. Go to your Supabase Dashboard" -ForegroundColor Gray
Write-Host "   2. Navigate to: SQL Editor" -ForegroundColor Gray
Write-Host "   3. Click 'New query'" -ForegroundColor Gray
Write-Host "   4. Copy the contents of: supabase/migrations/002_advanced_features.sql" -ForegroundColor Gray
Write-Host "   5. Paste into the editor" -ForegroundColor Gray
Write-Host "   6. Click 'Run' or press Ctrl+Enter" -ForegroundColor Gray
Write-Host "   7. Wait for completion (should take 5-10 seconds)" -ForegroundColor Gray

Write-Host "`n💡 Alternative: Use Supabase CLI" -ForegroundColor Yellow
Write-Host "   If you have Supabase CLI installed:" -ForegroundColor Gray
Write-Host "   $ supabase db push" -ForegroundColor White

Write-Host "`n🔍 Verify migration:" -ForegroundColor Cyan
Write-Host "   After running, check if these tables exist:" -ForegroundColor Gray
Write-Host "   - lead_personalization" -ForegroundColor White
Write-Host "   - optimal_send_times" -ForegroundColor White
Write-Host "   - send_time_analytics" -ForegroundColor White
Write-Host "   - ab_test_campaigns" -ForegroundColor White
Write-Host "   - ab_test_assignments" -ForegroundColor White
Write-Host "   - ab_test_events" -ForegroundColor White

Write-Host "`n✅ After migration, test with:" -ForegroundColor Green
Write-Host "   & .\test-advanced-features.ps1" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "   ADVANCED_FEATURES_GUIDE.md - Complete guide to all features" -ForegroundColor White

Write-Host "`n🚀 Ready to proceed?" -ForegroundColor Yellow
Write-Host "   Open Supabase Dashboard → SQL Editor and run the migration!" -ForegroundColor Gray

$openFile = Read-Host "`nWould you like to open the migration file? (y/n)"
if ($openFile -eq 'y' -or $openFile -eq 'Y') {
    $migrationFile = "supabase\migrations\002_advanced_features.sql"
    if (Test-Path $migrationFile) {
        Start-Process notepad.exe $migrationFile
        Write-Host "✅ Migration file opened in Notepad" -ForegroundColor Green
    } else {
        Write-Host "❌ Migration file not found at: $migrationFile" -ForegroundColor Red
    }
}

Write-Host "`n✨ Good luck!" -ForegroundColor Cyan
