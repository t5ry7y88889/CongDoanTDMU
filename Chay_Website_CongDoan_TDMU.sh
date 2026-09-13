#!/usr/bin/env bash
# =================================================================
# Website Cong Doan TDMU - Automatic Server Launcher (macOS / Linux)
# Works from any directory. Windows users use the .bat launcher.
# Starts the Express API (:3000) and the React SPA (:5173) together.
# =================================================================
set -e

# Locate the directory containing this script, wherever the user is
cd "$(dirname "$0")"

echo "================================================================"
echo "🚀 DANG KHOI CHAY SERVER CONG DOAN TDMU REAL SAAS ENGINE..."
echo "================================================================"
echo "⏳ Vui long doi 2 giay de Server khoi dong, trinh duyet se tu dong mo..."

# Open the browser silently after 2s, once node has started
( sleep 2 && open "http://localhost:3000/admin.html" "http://localhost:5173" 2>/dev/null || true ) &

echo ""
echo "================================================================"
echo "Express API  -> http://localhost:3000  (Admin CMS + API)"
echo "React SPA    -> http://localhost:5173  (Cong thong tin doan vien)"
echo "Dung Ctrl+C de dung ca hai server."
echo "================================================================"

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js chua duoc cai dat. Vui long cai Node.js >= 18." >&2
  exit 1
fi

npm run dev