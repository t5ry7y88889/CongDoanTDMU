#!/usr/bin/env bash
# =============================================================================
# Website Cong Doan TDMU - Fast Bash Server Launcher
# =============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "================================================================="
echo "🚀 ĐANG KHỞI CHẠY SERVER CÔNG ĐOÀN TDMU REAL SAAS ENGINE..."
echo "================================================================="

# 1. Giải phóng port 3000 nếu đang bị chiếm dụng
if command -v lsof >/dev/null 2>&1; then
    PID=$(lsof -ti:3000)
    if [ ! -z "$PID" ]; then
        echo "⚡ Đang giải phóng port 3000 (PID: $PID)..."
        kill -9 $PID >/dev/null 2>&1
    fi
fi

# 2. Mở trình duyệt vào Tòa soạn AI Studio
open_browser() {
    sleep 1
    URL="http://localhost:3000/admin.html#ai-creator"
    if command -v start >/dev/null 2>&1; then
        start "$URL" >/dev/null 2>&1
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$URL" >/dev/null 2>&1
    elif command -v open >/dev/null 2>&1; then
        open "$URL" >/dev/null 2>&1
    fi
}
open_browser &

echo "🟢 Server chạy trên cổng 3000: http://localhost:3000/admin.html#ai-creator"
echo "================================================================="

# 3. Khởi động Node Server
node server/server.js
