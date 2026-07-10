@echo off
title StudyTrack Launcher
color 0B

echo ===================================================
echo     StudyTrack - AI Developer Learning OS
echo                 RUN BOT  (Local)
echo ===================================================
echo.

echo [1/3] Generating Prisma Client...
cd backend
call npx prisma generate
cd ..
echo.

echo [2/3] Starting Backend (Express 5) on port 5000...
start "StudyTrack Backend" cmd /k "title StudyTrack Backend && color 0D && cd backend && echo Backend starting on https://cognarc-it-1.onrender.com ... && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend (Next.js 16) on port 3000...
start "StudyTrack Frontend" cmd /k "title StudyTrack Frontend && color 0E && cd frontend && echo Frontend starting on https://cognarc-it.vercel.app ... && npm run dev"

echo.
echo ===================================================
echo  All components are launching in separate windows!
echo.
echo  Frontend: https://cognarc-it.vercel.app
echo  Backend:  https://cognarc-it-1.onrender.com
echo  Health:   https://cognarc-it-1.onrender.com/health
echo ===================================================
echo  You can safely close this launcher window.
pause
