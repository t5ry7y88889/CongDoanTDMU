@echo off
chcp 65001 >nul
title HỆ THỐNG TRUYỀN THÔNG CÔNG ĐOÀN ĐH THỦ DẦU MỘT (DEMO RELEASE)
cls

:: Chuyển thư mục làm việc về đúng thư mục chứa file .bat
cd /d "%~dp0"

echo ==============================================================================
echo        TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT - ĐỒ ÁN CHUYÊN NGÀNH
echo        HỆ THỐNG WEBSITE TRUYỀN THÔNG CÔNG ĐOÀN TÍCH HỢP AI
echo ==============================================================================
echo.
echo [1/3] Đang kiểm tra môi trường Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LỖI] Máy tính chưa cài đặt Node.js hoặc chưa nhận biến môi trường PATH!
    echo Vui lòng tải và cài Node.js (phiên bản LTS) tại: https://nodejs.org
    echo.
    pause
    exit /b
)
echo       -^> Node.js đã sẵn sàng: 
node -v
echo.

echo [2/3] Đang kiểm tra và giải phóng cổng 3001 nếu đang chạy tiến trình cũ...
powershell -NoProfile -Command "try { $p = (Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue).OwningProcess; if ($p) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue; Write-Host '      -> Đã tắt tiến trình cũ chiếm cổng 3001 (PID:' $p ')' } else { Write-Host '      -> Cổng 3001 đang hoàn toàn trống.' } } catch { Write-Host '      -> Cổng 3001 sẵn sàng.' }"
echo.

echo [3/3] Đang khởi động Máy chủ Hệ thống (Express Backend + React App)...
echo ==============================================================================
echo  ĐỊA CHỈ TRUY CẬP BUỔI BÁO CÁO / DEMO:
echo    * Cổng Thông Tin Đoàn Viên:   http://localhost:3001
echo    * Phòng Biên Tập AI Studio:    http://localhost:3001/admin.html
echo.
echo  LƯU Ý QUAN TRỌNG:
echo    - Cửa sổ này sẽ duy trì máy chủ chạy liên tục cho toàn bộ website.
echo    - GIỮ NGUYÊN cửa sổ này trong suốt buổi thuyết trình / chấm điểm!
echo    - Để tắt hệ thống khi kết thúc: Nhấn Ctrl + C hoặc bấm nút X đóng cửa sổ.
echo ==============================================================================
echo.

:: Tự động bật trình duyệt web sau 2 giây (Chạy ngầm native không hiện popup)
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3001/admin.html"

:: Khởi chạy máy chủ Node
node server/server.js

if %errorlevel% neq 0 (
    echo.
    echo ==============================================================================
    echo [THÔNG BÁO] Máy chủ đã dừng hoạt động (Mã thoát: %errorlevel%).
    echo ==============================================================================
)

echo.
pause
