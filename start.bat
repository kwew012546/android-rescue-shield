@echo off
title Android Rescue Shield
cd /d "%~dp0"

echo ========================================================
echo   Android Rescue Shield
echo   Starting GUI Server...
echo ========================================================
echo.

:: Automatically kill any lingering zombie process on port 3210
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3210 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo Opening GUI at: http://localhost:3210
echo Press Ctrl+C or close this window to exit.
echo.

node server.js
pause
