@echo off
title Android Rescue Shield
cd /d "%~dp0"

echo ========================================================
echo   Android Rescue Shield
echo   Starting GUI Server...
echo ========================================================
echo.
echo If the GUI window does not open automatically,
echo please open your browser to: http://localhost:3210
echo.
echo Press Ctrl+C or close this window to exit.
echo.

node server.js
pause
