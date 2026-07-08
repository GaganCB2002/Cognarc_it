@echo off
title StudyTrack Launcher
cd /d "%~dp0"
cls

echo.
echo  $$$$$$$$\                    $$\                           $$\     
echo  \__$$  __|                   $$ |                          $$ |    
echo     $$ | $$$$$$\   $$$$$$$\ $$$$$$\    $$$$$$\  $$$$$$$\  $$$$$$\   
echo     $$ |$$  __$$\ $$  _____|\_$$  _|  $$  __$$\ $$  __$$\ \_$$  _|  
echo     $$ |$$$$$$$$ |\$$$$$$\    $$ |    $$$$$$$$ |$$ |  $$ |  $$ |    
echo     $$ |$$   ____| \____$$\   $$ |$$\ $$   ____|$$ |  $$ |  $$ |$$\ 
echo     $$ |\$$$$$$$\ $$$$$$$  |  \$$$$  |\$$$$$$$\ $$ |  $$ |  \$$$$  |
echo     \__| \_______|\_______/    \____/  \_______|\__|  \__|   \____/ 
echo.
echo  ================================================================
echo      AI Developer Learning OS - Local Development Launcher
echo  ================================================================
echo.

:: Read ports from environment variables or use defaults
if "%BACKEND_PORT%"=="" set BACKEND_PORT=5000
if "%FRONTEND_PORT%"=="" set FRONTEND_PORT=3000

:: ====================================================================
:: STEP 0: Check .env files
:: ====================================================================
echo  [PRE] Checking configuration...

if not exist "backend\.env" (
    echo  [FAIL] backend\.env not found!
    echo         Copy backend\.env.example to backend\.env and configure it.
    echo         Required: DATABASE_URL, JWT_SECRET, GEMINI_API_KEY
    pause
    exit /b 1
)
if not exist "frontend\.env.local" (
    echo  [FAIL] frontend\.env.local not found!
    echo         Copy frontend\.env.example to frontend\.env.local and configure it.
    pause
    exit /b 1
)
echo  [OK] Configuration files found.
echo.

:: ====================================================================
:: STEP 1: Find PostgreSQL
:: ====================================================================
echo  [1/6] Checking PostgreSQL...

:: Try common install paths
set PG_PATH=
if exist "C:\Program Files\PostgreSQL\17\bin\psql.exe" set PG_PATH=C:\Program Files\PostgreSQL\17\bin
if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" set PG_PATH=C:\Program Files\PostgreSQL\16\bin
if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" set PG_PATH=C:\Program Files\PostgreSQL\15\bin
if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" set PG_PATH=C:\Program Files\PostgreSQL\14\bin

if "%PG_PATH%"=="" (
    where psql >nul 2>&1
    if !errorlevel! equ 0 set PG_PATH=psql
)

if "%PG_PATH%"=="" (
    echo  [FAIL] PostgreSQL not found!
    echo         Install PostgreSQL from https://www.postgresql.org/download/windows/
    echo         Or ensure psql is in your PATH.
    pause
    exit /b 1
)

:: Add PG to PATH for this session
set "PATH=%PG_PATH%;%PATH%"
echo  [OK] PostgreSQL found at: %PG_PATH%
echo.

:: ====================================================================
:: STEP 2: Ensure PostgreSQL is running
:: ====================================================================
echo  [2/6] Checking PostgreSQL service...

pg_isready -h localhost -p 5432 >nul 2>&1
if errorlevel 1 (
    echo  [..] PostgreSQL is not responding. Attempting to start the service...
    sc query "postgresql-x64-17" >nul 2>&1 && (
        net start "postgresql-x64-17" >nul 2>&1
        timeout /t 5 /nobreak >nul
        pg_isready -h localhost -p 5432 >nul 2>&1
        if errorlevel 1 (
            echo  [FAIL] Could not start PostgreSQL. Start it manually from Services.
            pause
            exit /b 1
        )
    ) || (
        echo  [FAIL] PostgreSQL service not found. Is PostgreSQL installed?
        echo         Service name: postgresql-x64-17 was not found.
        pause
        exit /b 1
    )
)
echo  [OK] PostgreSQL is running and accepting connections.
echo.

:: ====================================================================
:: STEP 3: Setup database
:: ====================================================================
echo  [3/6] Setting up database...

:: Use PostgreSQL password from .env (default: root for local dev)
set "PGPASSWORD=root"

echo  [..] Connecting to PostgreSQL at localhost:5432...

:: Check if database exists
psql -h localhost -p 5432 -U postgres -lqt 2>nul | findstr /c:"studytrack" >nul 2>&1
if errorlevel 1 (
    echo  [..] Creating 'studytrack' database...
    psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE studytrack;" 2>&1
    if errorlevel 1 (
        echo  [FAIL] Could not create database.
        echo         Run manually: psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE studytrack;"
        pause
        exit /b 1
    )
    echo  [OK] 'studytrack' database created.
) else (
    echo  [OK] 'studytrack' database exists.
)
echo.

:: ====================================================================
:: STEP 4: Install dependencies
:: ====================================================================
echo  [4/6] Installing dependencies...

echo  [....] Backend dependencies...
cd backend
call npm install --loglevel=error 2>&1
if errorlevel 1 (
    echo  [FAIL] Backend npm install failed.
    pause
    exit /b 1
)
cd ..

echo  [....] Frontend dependencies...
cd frontend
call npm install --loglevel=error 2>&1
if errorlevel 1 (
    echo  [FAIL] Frontend npm install failed.
    cd ..
    pause
    exit /b 1
)
cd ..

echo  [OK] Dependencies installed.
echo.

:: ====================================================================
:: STEP 5: Generate Prisma client and sync schema
:: ====================================================================
echo  [5/6] Setting up Prisma...

cd backend
echo  [....] Generating Prisma client...
call npx prisma generate 2>&1
if errorlevel 1 (
    echo  [FAIL] Prisma generate failed.
    cd ..
    pause
    exit /b 1
)

echo  [....] Syncing schema to database (prisma db push)...
call npx prisma db push --accept-data-loss 2>&1
if errorlevel 1 (
    echo  [FAIL] Prisma db push failed. Check DATABASE_URL in backend\.env
    cd ..
    pause
    exit /b 1
)
cd ..

echo  [OK] Prisma setup complete.
echo.

:: ====================================================================
:: STEP 6: Kill any existing processes and start services
:: ====================================================================
echo  [6/6] Starting services...

:: Kill anything already on our ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /c":%BACKEND_PORT% " ^| findstr "LISTENING"') do (
    echo  [..] Killing old process on port %BACKEND_PORT% (PID: %%a)
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /c":%FRONTEND_PORT% " ^| findstr "LISTENING"') do (
    echo  [..] Killing old process on port %FRONTEND_PORT% (PID: %%a)
    taskkill /f /pid %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

:: Start backend
echo  [....] Starting Backend (Port %BACKEND_PORT%)...
start "StudyTrack Backend" cmd /k "title StudyTrack Backend && cd /d %~dp0backend && npm run dev"

:: Wait for backend to initialize
echo  [....] Waiting for backend to start...
timeout /t 5 /nobreak >nul

:: Start frontend
echo  [....] Starting Frontend (Port %FRONTEND_PORT%)...
start "StudyTrack Frontend" cmd /k "title StudyTrack Frontend && cd /d %~dp0frontend && npm run dev"

echo.
echo  ================================================================
echo       Environment is starting up!
echo  ================================================================
echo.
echo   Frontend   : http://localhost:%FRONTEND_PORT%
echo   Backend    : http://localhost:%BACKEND_PORT%
echo   Health     : http://localhost:%BACKEND_PORT%/health
echo   API Base   : http://localhost:%BACKEND_PORT%/api
echo.
echo   StudyBot (RAG Chatbot) available on Dashboard after login.
echo   Project indexer scans source files automatically on startup.
echo.
echo  ================================================================
echo   Default Accounts:
echo     user@studytrack.dev / password123  (Student)
echo     admin@studytrack.dev / password123 (Admin)
echo  ================================================================
echo.
echo  Close this window to stop all services.
echo.
pause
