import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function tryCommand(list) {
  const [bin, ...args] = list;
  const res = spawnSync(bin, [...args, 'version'], { encoding: 'utf8', cwd: root });
  if (res.status === 0) return { bin, prefix: args.length ? [args[0]] : [] };
  return null;
}

function detectRunner() {
  const compose =
    tryCommand(['docker', 'compose']) ||
    tryCommand(['podman', 'compose']) ||
    tryCommand(['docker-compose']);
  if (!compose) {
    console.error(
      '❌ Khong tim thay Docker Compose. Cai Docker Desktop hoac Podman truoc.'
    );
    process.exit(1);
  }
  return compose;
}

function run(compose, args) {
  const cmd = [compose.bin, ...compose.prefix, ...args];
  console.log(`$ ${cmd.join(' ')}`);
  const res = spawnSync(cmd[0], cmd.slice(1), {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, COMPOSE_PROJECT_NAME: 'congdoan-tdmu' },
  });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

const action = process.argv[2] || 'up';
const compose = detectRunner();

if (action === 'up') {
  run(compose, ['up', '-d']);
  console.log('==========================================');
  console.log('SQL Server dang chay: localhost:1433');
  console.log('Mat khau lay tu DB_PASSWORD trong .env');
  console.log('Chay "npm run db:init" de tao schema + seed.');
  console.log('==========================================');
} else if (action === 'down') {
  run(compose, ['down']);
  console.log('SQL Server da dung.');
} else {
  console.error(`Hanh dong khong hop le: ${action} (up|down)`);
  process.exit(1);
}