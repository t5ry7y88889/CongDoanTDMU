#!/usr/bin/env node
const net = require('net');
const { spawn } = require('child_process');

const BACKEND_PORT = 3000;
const FRONTEND_PORT = 5173;

const npmCmd = () => (process.platform === 'win32' ? 'npm.cmd' : 'npm');

function isPortOpen(port, host = '127.0.0.1', timeout = 1200) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

function startFrontendOnly() {
  const child = spawn(npmCmd(), ['--prefix', 'frontend', 'run', 'dev'], {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  child.on('exit', (code) => process.exit(code ?? 0));
  child.on('error', (err) => {
    console.error('Không khởi động được frontend:', err.message);
    process.exit(1);
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
      { name: 'frontend', command: 'npm run dev:frontend', prefixColor: 'green' }
    ],
    { killOthersOn: ['failure'], successCondition: 'all' }
  );

  result
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

(async () => {
  const backendRunning = await isPortOpen(BACKEND_PORT);

  if (backendRunning) {
    console.log('──────────────────────────────────────────────────────────');
    console.log(`🟢 Backend đã chạy sẵn tại http://localhost:${BACKEND_PORT}`);
    console.log(`   Chỉ khởi động frontend (Vite) tại http://localhost:${FRONTEND_PORT}`);
    console.log(`   API được proxy sang http://localhost:${BACKEND_PORT} — không tạo tiến trình trùng.`);
    console.log('──────────────────────────────────────────────────────────');
    startFrontendOnly();
  } else {
    console.log(`Backend chưa chạy — khởi động cả server (:${BACKEND_PORT}) và frontend (:${FRONTEND_PORT}).`);
    startBoth();
  }
})();
