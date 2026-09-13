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
start cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000/admin.html & start http://localhost:5173"

echo.
echo =================================================================
echo Express API  -^> http://localhost:3000  (Admin CMS + API)
echo React SPA    -^> http://localhost:5173  (Cong thong tin doan vien)
echo De cua so nay de duy tri ca hai web, tat cua so de dung server
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