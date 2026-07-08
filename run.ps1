param(
    [int]$BackendPort = 5000,
    [int]$FrontendPort = 3000
)

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

function Write-Step($text) { Write-Host "`n$text" -ForegroundColor Cyan }
function Write-OK($text) { Write-Host "  [OK] $text" -ForegroundColor Green }
function Write-Fail($text) { Write-Host "  [FAIL] $text" -ForegroundColor Red; exit 1 }
function Write-Info($text) { Write-Host "  [..] $text" -ForegroundColor Yellow }

Clear-Host

Write-Host @"

  $$$$$$$$\                    $$\                           $$\     
  \__$$  __|                   $$ |                          $$ |    
     $$ | $$$$$$\   $$$$$$$\ $$$$$$\    $$$$$$\  $$$$$$$\  $$$$$$\   
     $$ |$$  __$$\ $$  _____|\_$$  _|  $$  __$$\ $$  __$$\ \_$$  _|  
     $$ |$$$$$$$$ |\$$$$$$\    $$ |    $$$$$$$$ |$$ |  $$ |  $$ |    
     $$ |$$   ____| \____$$\   $$ |$$\ $$   ____|$$ |  $$ |  $$ |$$\ 
     $$ |\$$$$$$$\ $$$$$$$  |  \$$$$  |\$$$$$$$\ $$ |  $$ |  \$$$$  |
     \__| \_______|\_______/    \____/  \_______|\__|  \__|   \____/ 

"@ -ForegroundColor DarkCyan
Write-Host "  ================================================================" -ForegroundColor DarkGray
Write-Host "      AI Developer Learning OS - Local Development Launcher" -ForegroundColor Gray
Write-Host "  ================================================================" -ForegroundColor DarkGray
Write-Host ""

# ====================================================================
# STEP 0: Check configuration
# ====================================================================
Write-Step "STEP 0/7: Checking configuration..."

if (-not (Test-Path "backend\.env")) {
    Write-Fail "backend\.env not found! Copy backend\.env.example to backend\.env and configure it."
}
if (-not (Test-Path "frontend\.env.local")) {
    Write-Fail "frontend\.env.local not found! Copy frontend\.env.example to frontend\.env.local and configure it."
}
Write-OK "Configuration files found"

# ====================================================================
# STEP 1: Find PostgreSQL
# ====================================================================
Write-Step "STEP 1/7: Finding PostgreSQL..."

$pgPaths = @(
    "C:\Program Files\PostgreSQL\17\bin",
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files\PostgreSQL\14\bin"
)

$pgBin = $null
foreach ($p in $pgPaths) {
    if (Test-Path "$p\psql.exe") { $pgBin = $p; break }
}
if (-not $pgBin) { $pgBin = (Get-Command psql -ErrorAction SilentlyContinue).Source | Split-Path }

if (-not $pgBin) {
    Write-Fail "PostgreSQL not found! Install from https://www.postgresql.org/download/windows/"
}
$env:Path = "$pgBin;$env:Path"
Write-OK "PostgreSQL found at: $pgBin"

# ====================================================================
# STEP 2: Ensure PostgreSQL is running
# ====================================================================
Write-Step "STEP 2/7: Checking PostgreSQL service..."

$pgReady = & pg_isready -h localhost -p 5432 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Info "PostgreSQL not responding. Attempting to start service..."
    $svc = Get-Service postgresql* -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($svc -and $svc.Status -ne 'Running') {
        Start-Service $svc.Name
        Start-Sleep 5
        $pgReady = & pg_isready -h localhost -p 5432 2>&1
        if ($LASTEXITCODE -ne 0) { Write-Fail "Could not start PostgreSQL. Start it manually." }
    } elseif (-not $svc) {
        Write-Fail "PostgreSQL service not found."
    }
}
Write-OK "PostgreSQL is running and accepting connections"

# ====================================================================
# STEP 3: Create database if needed
# ====================================================================
Write-Step "STEP 3/7: Setting up database..."

# Extract password from DATABASE_URL in .env
$envContent = Get-Content "backend\.env" -Raw
$dbUrlMatch = [regex]::Match($envContent, 'DATABASE_URL="([^"]+)"')
if ($dbUrlMatch.Success) {
    $dbUrl = $dbUrlMatch.Groups[1].Value
    $pgPass = [regex]::Match($dbUrl, ':([^@]+)@').Groups[1].Value
    $dbName = [regex]::Match($dbUrl, '/([^/?]+)').Groups[1].Value
} else {
    $pgPass = "root"
    $dbName = "studytrack"
}
$env:PGPASSWORD = $pgPass

Write-Info "Database: $dbName on localhost:5432"

# Create database if it doesn't exist
$exists = & psql -h localhost -p 5432 -U postgres -lqt 2>&1 | Select-String $dbName
if (-not $exists) {
    Write-Info "Creating '$dbName' database..."
    & psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE $dbName;" 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Fail "Could not create database." }
    Write-OK "'$dbName' database created"
} else {
    Write-OK "'$dbName' database exists"
}

# ====================================================================
# STEP 4: Install dependencies
# ====================================================================
Write-Step "STEP 4/7: Installing dependencies..."

Write-Info "Backend dependencies..."
Set-Location backend
npm install --loglevel=error 2>&1
if ($LASTEXITCODE -ne 0) { Write-Fail "Backend npm install failed" }
Set-Location $ProjectRoot

Write-Info "Frontend dependencies..."
Set-Location frontend
npm install --loglevel=error 2>&1
if ($LASTEXITCODE -ne 0) { Write-Fail "Frontend npm install failed" }
Set-Location $ProjectRoot

Write-OK "Dependencies installed"

# ====================================================================
# STEP 5: Generate Prisma client and sync schema
# ====================================================================
Write-Step "STEP 5/7: Setting up Prisma..."

Set-Location backend
Write-Info "Generating Prisma client..."
npx prisma generate 2>&1
if ($LASTEXITCODE -ne 0) { Write-Fail "Prisma generate failed" }

Write-Info "Syncing schema to database..."
npx prisma db push --accept-data-loss 2>&1
if ($LASTEXITCODE -ne 0) { Write-Fail "Prisma db push failed" }
Set-Location $ProjectRoot

Write-OK "Prisma setup complete"

# ====================================================================
# STEP 6: Kill existing processes on our ports
# ====================================================================
Write-Step "STEP 6/7: Cleaning up ports..."

$portsToCheck = @($BackendPort, $FrontendPort)
foreach ($port in $portsToCheck) {
    $connections = netstat -ano | Select-String ":$port\s" | Select-String "LISTENING"
    foreach ($conn in $connections) {
        $parts = $conn -split '\s+'
        $pid = $parts[-1]
        Write-Info "Killing old process on port $port (PID: $pid)..."
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep 2
Write-OK "Ports $BackendPort and $FrontendPort are free"

# ====================================================================
# STEP 7: Start services
# ====================================================================
Write-Step "STEP 7/7: Starting services..."

Write-Info "Starting Backend (Port $BackendPort)..."
$backendJob = Start-Process -PassThru -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/k title StudyTrack Backend && cd /d $ProjectRoot\backend && npm run dev"
Start-Sleep 3

Write-Info "Starting Frontend (Port $FrontendPort)..."
$frontendJob = Start-Process -PassThru -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/k title StudyTrack Frontend && cd /d $ProjectRoot\frontend && npm run dev"

Write-Host ""
Write-Host "  ================================================================" -ForegroundColor DarkGray
Write-Host "       Environment is starting up!" -ForegroundColor Green
Write-Host "  ================================================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "   Frontend   : http://localhost:$FrontendPort" -ForegroundColor Yellow
Write-Host "   Backend    : http://localhost:$BackendPort" -ForegroundColor Yellow
Write-Host "   Health     : http://localhost:$BackendPort/health" -ForegroundColor Yellow
Write-Host "   API Base   : http://localhost:$BackendPort/api" -ForegroundColor Yellow
Write-Host ""
Write-Host "   StudyBot (RAG Chatbot) available on Dashboard after login." -ForegroundColor Cyan
Write-Host "   Project indexer scans source files automatically on startup." -ForegroundColor Cyan
Write-Host ""
Write-Host "  ================================================================" -ForegroundColor DarkGray
Write-Host "   Default Accounts:" -ForegroundColor Gray
Write-Host "     user@studytrack.dev / password123  (Student)" -ForegroundColor Gray
Write-Host "     admin@studytrack.dev / password123 (Admin)" -ForegroundColor Gray
Write-Host "  ================================================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Close this window to stop all services." -ForegroundColor DarkGray
Write-Host ""

# Keep the script running until user presses Ctrl+C
try {
    while ($true) { Start-Sleep 60 }
} finally {
    Write-Info "Shutting down services..."
    $backendJob | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
    $frontendJob | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
    Write-OK "All services stopped"
}
