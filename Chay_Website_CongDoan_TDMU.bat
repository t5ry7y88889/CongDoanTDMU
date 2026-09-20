@echo off
title Website Cong Doan TDMU - Automatic Server Launcher
color 0A

:: Lay chinh xac duong dan cua thu muc chua file .bat nay
cd /d "%~dp0"

echo =================================================================
echo 🚀 DANG KHOI CHAY SERVER CONG DOAN TDMU REAL SAAS ENGINE...
echo =================================================================

:: 1. Kiem tra va giai phong port 3000 neu co tien trinh node cu bi treo
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [Notice] Phat hien cong 3000 dang bi chiem boi PID %%a, dang giai phong...
    taskkill /F /PID %%a >nul 2>&1
)

:: 2. Mo trinh duyet truc tiep vao Toa Soan AI Studio sau 1 giay
start cmd /c "timeout /t 1 /nobreak >nul & start http://localhost:3000/admin.html#ai-creator"

echo.
echo =================================================================
echo 🟢 Server dang chay thoi gian thuc tren cong 3000...
echo 🌐 Dia chi: http://localhost:3000/admin.html#ai-creator
echo (De cua so nay de duy tri web, tat cua so de dung server)
echo =================================================================
echo.

:: 3. Khoi chay Node.js Server
node server/server.js
pause
