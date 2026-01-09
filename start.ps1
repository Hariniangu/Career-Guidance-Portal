# PowerShell script to start the Career Guidance App
# This script sets up the PATH and starts the server

Write-Host "Starting Career Guidance Application..." -ForegroundColor Green
Write-Host ""

# Add Node.js to PATH for this session
$env:Path += ";C:\Program Files\nodejs\"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Start the server
Write-Host "Starting server on http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm start
