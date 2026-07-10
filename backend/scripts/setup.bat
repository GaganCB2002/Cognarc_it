@echo off
echo === Cognarc IT Backend Setup ===
echo.

cd /d "%~dp0.."

echo [1/3] Pushing database schema...
call npx prisma db push

echo.
echo [2/3] Seeding database...
call npx prisma db seed

echo.
echo [3/3] Building TypeScript...
call npx prisma generate && npx tsc

echo.
echo === Setup complete ===
