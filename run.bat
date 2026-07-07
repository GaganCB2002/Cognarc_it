@echo off
title StudyTrack Launcher
echo Starting StudyTrack Local Environment...
echo.

:: Read ports from environment variables or use defaults
if "%BACKEND_PORT%"=="" set BACKEND_PORT=5000
if "%FRONTEND_PORT%"=="" set FRONTEND_PORT=3000

echo Installing dependencies if missing...
cd backend && call npm install && cd ..
cd frontend && call npm install && cd ..

echo Starting services...
start "StudyTrack Backend (Port %BACKEND_PORT%)" cmd /k "title StudyTrack Backend && cd backend && npm run dev"
start "StudyTrack Frontend (Port %FRONTEND_PORT%)" cmd /k "title StudyTrack Frontend && cd frontend && npm run dev"

echo.
echo ============================================
echo  StudyTrack Local Environment
echo ============================================
echo  Backend:  http://localhost:%BACKEND_PORT%
echo  Frontend: http://localhost:%FRONTEND_PORT%
echo  Health:   http://localhost:%BACKEND_PORT%/health
echo ============================================
echo.
echo To change ports, set BACKEND_PORT and FRONTEND_PORT
echo environment variables before running this script.
echo.
pause
