#!/usr/bin/env bash
# =================================================================
# Website Cong Doan TDMU - ONE-CLICK DEV LAUNCHER (macOS / Linux)
# Works from any directory. Windows users use the .bat launcher.
# Chay DUY NHAT lenh nay cho DEV MODE:
#   React Admin (5184) + Portal Doan vien (5173) + REST API (3000)
# Bản build production chay gon 1 URL duy nhat:  npm run start
# =================================================================
set -e

# Locate the directory containing this script, wherever the user is
cd "$(dirname "$0")"

echo "================================================================"
echo "🚀 DANG KHOI CHAY SERVER CONG DOAN TDMU REAL SAAS ENGINE..."
echo "================================================================"
echo "⏳ Vui long doi 2 giay de Server khoi dong, trinh duyet se tu dong mo..."

# Open the browser silently after 2s, once node has started
( sleep 2 && open "http://localhost:5184" "http://localhost:5173" 2>/dev/null || true ) &

echo ""
echo "================================================================"
echo "DEV MODE (lenh duy nhat: npm run dev)"
echo "  Admin React WP      -> http://localhost:5184"
echo "  Portal Doan vien    -> http://localhost:5173"
echo "  REST API            -> http://localhost:3000"
echo "PROD MODE (1 URL)     -> npm run start  (chay tai :3000)"
echo "Dung Ctrl+C de dung tat ca cac server."
echo "================================================================"

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js chua duoc cai dat. Vui long cai Node.js >= 18." >&2
  exit 1
fi

npm run dev