@echo off
echo Starting StudyTrack Local Environment...

start "StudyTrack Backend" cmd /c "cd backend && npm run dev"
start "StudyTrack Frontend" cmd /c "cd frontend && npm run dev"

echo Both services are starting!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
