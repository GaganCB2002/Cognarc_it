@echo off
title StudyTrack Launcher
color 0B

echo ===================================================
echo     StudyTrack - AI Developer Learning OS
echo                 RUN BOT
echo ===================================================
echo.

echo [1/4] Checking/Starting PostgreSQL Database Service...
:: Tries to start common PostgreSQL windows services just in case it's stopped.
net start postgresql-x64-16 >nul 2>&1
net start postgresql-x64-15 >nul 2>&1
net start postgresql-x64-14 >nul 2>&1
echo Database service step completed. (It will connect using the URL in backend/.env)
echo.

echo [2/4] Generating Prisma Client...
cd backend
call npx prisma generate
cd ..
echo.

echo [3/4] Starting Backend (Express 5)...
:: Opens a new command prompt for the backend
start "StudyTrack Backend" cmd /k "title StudyTrack Backend && color 0D && cd backend && echo Starting Backend... && npm run dev"

echo [4/4] Starting Frontend (Next.js 16)...
:: Opens a new command prompt for the frontend
start "StudyTrack Frontend" cmd /k "title StudyTrack Frontend && color 0E && cd frontend && echo Starting Frontend... && npm run dev"

echo.
echo ===================================================
echo All components are launching in separate windows!
echo.
echo Frontend will be available at: http://localhost:3000
echo Backend will be available at:  http://localhost:5000
echo ===================================================
echo You can safely close this launcher window.
pause
