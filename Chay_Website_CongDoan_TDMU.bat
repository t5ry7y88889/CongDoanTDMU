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

:: 2. Kiem tra tinh trang mo hinh Local AI (Qwen2.5-1.5B GGUF)
if exist "server\models\qwen2.5-1.5b-instruct-q4_k_m.gguf" (
    echo [Local AI] ✅ Phat hien mo hinh Qwen2.5-1.5B GGUF (1.1GB) - Che do Offline 100% da san sang!
) else (
    echo [Local AI] ⚠️ Chua phat hien file mo hinh server\models\qwen2.5-1.5b-instruct-q4_k_m.gguf
    echo [Local AI] 💡 Chay "npm run download-model" neu muon su dung Local AI offline.
)

:: 3. Mo trinh duyet truc tiep vao Toa Soan AI Studio sau 1 giay
start cmd /c "timeout /t 1 /nobreak >nul & start http://localhost:3000/admin.html#ai-creator"

echo.
echo =================================================================
echo 🟢 Server dang chay thoi gian thuc tren cong 3000...
echo 🌐 Dia chi: http://localhost:3000/admin.html#ai-creator
echo 🤖 Local AI: Hoat dong nhung truc tiep trong Server (Offline, 0.3s)
echo (De cua so nay de duy tri web, tat cua so de dung server)
echo =================================================================
echo.

:: 4. Khoi chay Node.js Server
node server/server.js
pause
