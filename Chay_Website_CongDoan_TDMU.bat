@echo off
title Website Cong Doan TDMU - Automatic Server Launcher
color 0A

:: Lay chinh xac duong dan cua thu muc chua file .bat nay, bat ke user de o dau
cd /d "%~dp0"

echo =================================================================
echo 🚀 DANG KHOI CHAY SERVER CONG DOAN TDMU REAL SAAS ENGINE...
echo =================================================================

echo ⏳ Vui long doi 2 giay de Server khoi dong, trinh duyet se tu dong mo...

:: Mo trinh duyet ngam sau 2 giay de dam bao Node.js da khoi dong xong
start cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5184 & start http://localhost:5173"

echo.
echo =================================================================
echo DEV MODE (lenh duy nhat: npm run dev)
echo   Admin React WP      -^> http://localhost:5184
echo   Portal Doan vien    -^> http://localhost:5173
echo   REST API            -^> http://localhost:3000
echo PROD MODE (1 URL)     -^> npm run start  (chay tai :3000)
echo De cua so nay de duy tri ca ba web, tat cua so de dung server
echo =================================================================

:: Kiem tra Node.js da duoc cai dat chua
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo ❌ Node.js chua duoc cai dat. Vui long cai Node.js ^>^= 18.
  pause
  exit /b 1
)

:: Khoi chay backend + frontend dong thoi
call npm run dev
pause