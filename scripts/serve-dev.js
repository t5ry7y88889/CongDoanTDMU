#!/usr/bin/env node
const net = require('net');
const { spawn } = require('child_process');

const BACKEND_PORT = 3000;
const FRONTEND_PORT = 5173;
const ADMIN_PORT = 5184;

const npmCmd = () => (process.platform === 'win32' ? 'npm.cmd' : 'npm');

function isPortOpen(port, host = '127.0.0.1', timeout = 1200) {
  const probe = (h) => new Promise((resolve) => {
    const socket = new net.Socket();
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, h);
  });
  // Probe IPv4 loopback trước, rồi IPv6 loopback (macOS hay bind ::1)
  return probe(host).then((v4) => (v4 ? true : probe('::1')));
}

// Spawn one Vite dev server. Ports are strict (strictPort: true),
// so conflicting copies fail loudly instead of jumping to a new port.
function spawnVite(prefixDir, port) {
  const child = spawn(npmCmd(), ['--prefix', prefixDir, 'run', 'dev'], {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  child.on('error', (err) => {
    console.error(`Không khởi động được Vite (${prefixDir}) tại :${port}:`, err.message);
  });
  return child;
}

async function startFrontends() {
  const [backendRunning, portalRunning, adminRunning] = await Promise.all([
    isPortOpen(BACKEND_PORT),
    isPortOpen(FRONTEND_PORT),
    isPortOpen(ADMIN_PORT)
  ]);

  if (backendRunning) {
    console.log(`🟢 Backend đã chạy sẵn tại http://localhost:${BACKEND_PORT} — không tạo tiến trình trùng.`);
  } else {
    console.log(`❌ Backend chưa chạy. Chạy "npm run dev:server" (hoặc "npm run start") trong một terminal khác.`);
    console.log(`   API tại http://localhost:${BACKEND_PORT} là bắt buộc cho hai frontend.`);
  }

  const children = [];
  const tasks = [
    { prefixDir: 'frontend', port: FRONTEND_PORT, label: 'Cổng thông tin Đoàn viên', url: `http://localhost:${FRONTEND_PORT}` },
    { prefixDir: 'frontend-admin', port: ADMIN_PORT, label: 'React Admin', url: `http://localhost:${ADMIN_PORT}` }
  ];

  for (const t of tasks) {
    const running = t.port === FRONTEND_PORT ? portalRunning : adminRunning;
    if (running) {
      console.log(`🟢 ${t.label} đã chạy sẵn tại ${t.url} — bỏ qua.`);
    } else {
      console.log(`🚀 Khởi động ${t.label} tại ${t.url}...`);
      children.push(spawnVite(t.prefixDir, t.port));
    }
  }

  if (children.length === 0) {
    console.log('──────────────────────────────────────────────────────────');
    console.log('Tất cả tiến trình đã chạy sẵn. Tạm dừng launcher (Ctrl+C để thoát).');
    console.log('──────────────────────────────────────────────────────────');
    setInterval(() => {}, 1 << 30);
    return;
  }

  let exited = false;
  children.forEach((child) => {
    child.on('exit', (code) => {
      if (exited) return;
      exited = true;
      children.forEach((c) => c !== child && c.kill());
      process.exit(code ?? 0);
    });
  });
}

function startBoth() {
  let concurrently;
  try {
    concurrently = require('concurrently');
  } catch (err) {
    console.error('Thiếu gói "concurrently". Chạy "npm install" trước.', err.message);
    process.exit(1);
  }

  const { result } = concurrently(
    [
      { name: 'server', command: 'npm run dev:server', prefixColor: 'blue' },
      { name: 'portal', command: 'npm --prefix frontend run dev', prefixColor: 'green' },
      { name: 'admin', command: 'npm --prefix frontend-admin run dev', prefixColor: 'magenta' }
    ],
    { killOthersOn: ['failure'], successCondition: 'all', defaultInputTarget: 'server' }
  );

  result
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

(async () => {
  const backendRunning = await isPortOpen(BACKEND_PORT);
  const banner = `============================================================
🚀  CÔNG ĐOÀN TDMU — DEV MODE
    React Admin:            http://localhost:${ADMIN_PORT}
    Portal Đoàn viên:       http://localhost:${FRONTEND_PORT}
    REST API / Prod build:  http://localhost:${BACKEND_PORT}
    (Bản build production chạy gọn trên :${BACKEND_PORT} qua "npm run start")
============================================================`;
  console.log(banner);

  if (backendRunning) {
    await startFrontends();
  } else {
    console.log(`Backend chưa chạy — khởi động cả server (:${BACKEND_PORT}), portal (:${FRONTEND_PORT}) và admin (:${ADMIN_PORT}).`);
    startBoth();
  }
})();