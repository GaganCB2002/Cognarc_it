@echo off
title StudyTrack Launcher
color 0B

echo ===================================================
echo     StudyTrack - AI Developer Learning OS
echo                 RUN BOT
echo ===================================================
echo.

echo [1/3] Generating Prisma Client...
cd backend
call npx prisma generate
cd ..
echo.

echo [2/3] Starting Backend (Express 5)...
start "StudyTrack Backend" cmd /k "title StudyTrack Backend && color 0D && cd backend && echo Starting Backend... && npm run dev"

echo [3/3] Starting Frontend (Next.js 16)...
start "StudyTrack Frontend" cmd /k "title StudyTrack Frontend && color 0E && cd frontend && echo Starting Frontend... && npm run dev"

echo.
echo ===================================================
echo All components are launching in separate windows!
echo.
echo Frontend will be available at: https://cognarc-it.vercel.app
echo Backend will be available at:  https://cognarc-it-1.onrender.com
echo ===================================================
echo You can safely close this launcher window.
pause
