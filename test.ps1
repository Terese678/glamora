
# test.ps1
Write-Host "Clearing Vitest cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules/.vitest -ErrorAction SilentlyContinue

Write-Host "Running tests..." -ForegroundColor Green
npm run vitest

Write-Host "Tests completed!" -ForegroundColor Cyan