# PowerShell Launcher cho Hệ thống Truyền thông Công đoàn TDMU
Set-Location $PSScriptRoot
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "       TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT - ĐỒ ÁN CHUYÊN NGÀNH" -ForegroundColor Yellow
Write-Host "       HỆ THỐNG WEBSITE TRUYỀN THÔNG CÔNG ĐOÀN TÍCH HỢP AI" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Giải phóng cổng 3001 nếu đang chạy
try {
    $oldProc = (Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue).OwningProcess
    if ($oldProc) {
        Stop-Process -Id $oldProc -Force -ErrorAction SilentlyContinue
        Write-Host "-> Đã giải phóng cổng 3001 từ tiến trình cũ (PID: $oldProc)" -ForegroundColor Yellow
    }
} catch {}

# 2. Hẹn giờ mở trình duyệt sau 2 giây
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2.5
    Start-Process "http://localhost:3001/admin.html"
} | Out-Null

Write-Host "-> Đang khởi chạy máy chủ Express trên cổng 3001..." -ForegroundColor Green
Write-Host "-> Trình duyệt sẽ tự động mở trang Quản trị: http://localhost:3001/admin.html" -ForegroundColor Cyan
Write-Host ""

node server/server.js
