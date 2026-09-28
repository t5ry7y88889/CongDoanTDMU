@echo off
chcp 65001 >nul
title Website Cong Doan TDMU - He Thong Khoi Chay Tu Dong
color 0A

REM Chuyen thu muc hien tai den dung thu muc chua file bat nay
cd /d "%~dp0"

echo =================================================================
echo    HE THONG TRUYEN THONG CONG DOAN TDMU - LOCAL SERVER
echo =================================================================

REM 1. Giai phong cong 3000 neu dang bi chiem boi tien trinh cu
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [He thong] Dang giai phong cong 3000 tu PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

REM 2. Kiem tra mo hinh Local AI
if exist "server\models\qwen2.5-1.5b-instruct-q4_k_m.gguf" (
    echo [Local AI] Mo hinh Qwen2.5-1.5B GGUF 1.1GB da san sang che do Offline 100%%
) else (
    echo [Local AI] Chua co mo hinh offline. Ban co the chay: npm run download-model
)

REM 3. Tu dong bat trinh duyet vao Admin Studio sau 2 giay
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000/admin.html#ai-creator"

echo.
echo =================================================================
echo  May chu dang hoat dong tai: http://localhost:3000/admin.html
echo  De nguyen cua so nay de duy tri web. Dong cua so de tat.
echo =================================================================
echo.

REM 4. Khoi chay server
node server/server.js
if %errorlevel% neq 0 (
    echo.
    echo [Loi] May chu bi tat voi ma loi %errorlevel%
    pause
)
pause
