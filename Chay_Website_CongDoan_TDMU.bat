@echo off
chcp 65001 >nul
title HỆ THỐNG TRUYỀN THÔNG CÔNG ĐOÀN TDMU - LAUNCHER
color 0B

REM Chuyen den thu muc goc cua du an
cd /d "%~dp0"

cls
echo ===============================================================================
echo        TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT - CÔNG ĐOÀN CƠ SỞ
echo        HỆ THỐNG BIÊN TẬP VÀ XUẤT BẢN TRUYỀN THÔNG ĐA KÊNH
echo ===============================================================================
echo.

REM 1. Kiem tra moi truong Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [LỖI] Không tìm thấy Node.js trên máy tính!
    echo Vui lòng cài đặt Node.js từ https://nodejs.org trước khi khởi chạy.
    echo.
    pause
    exit /b 1
)

REM 2. Giai phong cong 3000 va 3001 neu dang bi chiem boi tien trinh cu
for %%p in (3000 3001) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%%p" ^| findstr "LISTENING"') do (
        if not "%%a"=="" (
            echo [Hệ thống] Đang giải phóng cổng %%p từ tiến trình cũ - PID %%a...
            taskkill /F /PID %%a >nul 2>&1
        )
    )
)

REM 2.1. Lay PORT tu file .env
set APP_PORT=3001
if exist ".env" (
    for /f "tokens=1,2 delims==" %%i in (.env) do (
        if "%%i"=="PORT" set APP_PORT=%%j
    )
)

REM 3. Kiem tra ban build Frontend React [Tiptap AI Studio]
if not exist "frontend\dist\index.html" (
    echo [Frontend] Chưa phát hiện bản build giao diện. Đang biên dịch React Studio...
    cd frontend && call npm run build && cd ..
    echo [Frontend] Hoàn tất build giao diện!
)

REM 4. Kiem tra trang thai AI Engine [Hybrid Cloud AI]
echo [AI Engine] Kiểm tra trạng thái AI:
findstr /i "GROQ_API_KEY=" .env >nul 2>&1
if %errorlevel% equ 0 (
    echo   + Groq Qwen3.8-27B : SẴN SÀNG [Sửa tại chỗ Bubble Menu siêu tốc]
) else (
    echo   - Groq API Key     : Chưa cấu hình trong .env
)

findstr /i "GEMINI_API_KEY=" .env >nul 2>&1
if %errorlevel% equ 0 (
    echo   + Gemini 3.8 Flash : SẴN SÀNG [Copilot toàn bài, Tòa soạn tự hành]
) else (
    echo   - Gemini API Key   : Chưa cấu hình trong .env
)

echo.
echo ===============================================================================
echo  🌐 CÁC ĐỊA CHỈ TRUY CẬP HỆ THỐNG (PORT: %APP_PORT%):
echo    • Phòng Biên Tập AI Studio : http://localhost:%APP_PORT%/admin.html#ai-creator
echo    • Bảng Điều Hành và Tin Tức : http://localhost:%APP_PORT%/admin.html#dashboard
echo    • Cổng Thông Tin Đoàn Viên : http://localhost:%APP_PORT%/
echo.
echo  💡 Để nguyên cửa sổ này để duy trì hoạt động máy chủ.
echo  🛑 Nhấn Ctrl + C hoặc đóng cửa sổ này để tắt hệ thống.
echo ===============================================================================
echo.

REM 5. Tu dong mo trinh duyet sau 2 giay
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:%APP_PORT%/admin.html#ai-creator"

REM 6. Khoi chay Server Express & MSSQL Backend
echo [Khởi động] Đang kích hoạt máy chủ Backend trên cổng %APP_PORT%...
node server/server.js
if %errorlevel% neq 0 (
    echo.
    echo [LỖI] Máy chủ dừng với mã lỗi: %errorlevel%
    pause
)
pause
