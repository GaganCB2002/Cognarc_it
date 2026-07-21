@echo off
title StudyTrack Launcher
color 0B

echo ===================================================
echo     StudyTrack - AI Developer Learning OS
echo            FULL PROJECT LAUNCHER
echo ===================================================
echo.

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)
echo [OK] Node.js found: 
node -v
echo.

:: --- Step 1: Install backend dependencies if needed ---
echo [1/5] Checking backend dependencies...
if not exist "backend\node_modules" (
    echo   Installing backend dependencies...
    cd backend
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Backend npm install failed.
        pause
        exit /b 1
    )
    cd ..
) else (
    echo   Backend dependencies already installed.
)
echo.

:: --- Step 2: Install frontend dependencies if needed ---
echo [2/5] Checking frontend dependencies...
if not exist "frontend\node_modules" (
    echo   Installing frontend dependencies...
    cd frontend
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Frontend npm install failed.
        pause
        exit /b 1
    )
    cd ..
) else (
    echo   Frontend dependencies already installed.
)
echo.

:: --- Step 3: (Skipped) Prisma is no longer used ---
echo.


:: --- Step 4: Clean up existing processes on required ports ---
echo [4/6] Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R ":5000 " ^| findstr /R "LISTENING"') do (
    echo   Killing backend process on port 5000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R ":3000 " ^| findstr /R "LISTENING"') do (
    echo   Killing frontend process on port 3000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo.

:: --- Step 5: Start Backend (Express 5) on port 5000 ---
echo [5/6] Starting Backend (Express 5) on port 5000...
start "StudyTrack Backend" cmd /k "title StudyTrack Backend && color 0D && cd backend && echo Backend starting on http://localhost:5000 ... && npm run dev"

timeout /t 3 /nobreak >nul

:: --- Step 6: Start Frontend (Next.js 16) on port 3000 ---
echo [6/6] Starting Frontend (Next.js 16) on port 3000...
start "StudyTrack Frontend" cmd /k "title StudyTrack Frontend && color 0E && cd frontend && echo Frontend starting on http://localhost:3000 ... && npm run dev"

echo.
echo ===================================================
echo  All components are launching in separate windows!
echo.
echo  Frontend:   http://localhost:3000
echo  Backend:   http://localhost:5000
echo  Health:    http://localhost:5000/health
echo ===================================================
echo  Close this window or press any key to exit.
pause
