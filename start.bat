@echo off
chcp 65001 >nul
title Android Rescue Shield
echo ========================================================
echo  🛡️  Android Adware & Screen Hijack Rescue Tool
echo  กำลังเริ่มต้นเซิร์ฟเวอร์กู้ภัย...
echo ========================================================

cd /d "%~dp0"

:: Start Node.js server in the background
start /b "" node server.js

:: Wait 1.5 seconds for server to bind port
timeout /t 2 /nobreak >nul

:: Launch Desktop App Window using Edge App mode or Default Browser
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3210
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3210
) else (
    start http://localhost:3210
)

echo.
echo [✓] เปิดหน้าต่างโปรแกรมเรียบร้อยแล้วที่ http://localhost:3210
echo กดปิดหน้าต่าง Command Prompt นี้เมื่อต้องการปิดโปรแกรม
echo.
pause
