@echo off
title StudyTrack Launcher
echo Starting StudyTrack Local Environment...

echo Installing dependencies if missing...
cd backend && call npm install && cd ..
cd frontend && call npm install && cd ..

start "StudyTrack Backend (Port 5000)" cmd /k "title StudyTrack Backend && cd backend && npm run dev"
start "StudyTrack Frontend (Port 3000)" cmd /k "title StudyTrack Frontend && cd frontend && npm run dev"

echo Both services are starting!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Please leave this window open to keep the launcher active.
pause
