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

:: Check for .env files
if not exist "backend\.env" (
    echo  [WARN] backend\.env not found! Copy from .env.example and configure.
    echo.
)
if not exist "frontend\.env.local" (
    echo  [WARN] frontend\.env.local not found! Copy from .env.example and configure.
    echo.
)

echo  [1/4] Installing backend dependencies...
cd backend
call npm install --silent 2>nul
cd ..
echo  [OK] Backend dependencies installed.
echo.

echo  [2/4] Installing frontend dependencies...
cd frontend
call npm install --silent 2>nul
cd ..
echo  [OK] Frontend dependencies installed.
echo.

echo  [3/4] Generating Prisma client...
cd backend
call npx prisma generate 2>nul
echo  [OK] Prisma client generated.
echo.

echo  [4/4] Starting services...
start "StudyTrack Backend" cmd /k "title StudyTrack Backend && cd backend && npm run dev"
start "StudyTrack Frontend" cmd /k "title StudyTrack Frontend && cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

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
