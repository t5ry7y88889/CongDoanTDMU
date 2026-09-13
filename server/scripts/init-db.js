// =========================================================================
// Cross-platform SQL Server initializer.
// Runs database/schema_*.sql + database/seed_*.sql without requiring
// sqlcmd/SSMS — works on macOS (Podman/Docker) and Windows.
// Usage:
//   node server/scripts/init-db.js          # create DB + apply schema + seed
//   node server/scripts/init-db.js --drop   # drop DB first, then re-create
// =========================================================================
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const fs = require('fs');
const sql = require('mssql');

const DB_NAME = process.env.DB_DATABASE || 'TDMU_TradeUnion_DB';
const DB_DIR = path.join(__dirname, '../../database');

const sqlConfig = {
  server: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: 'master',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'StrongP@ssw0rd',
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 1, min: 1 }, // keep a single connection so "USE <db>" sticks
};

function splitBatches(sqlText) {
  return sqlText
    .split(/^\s*GO\s*$/gim)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);
}

function firstLine(batch) {
  const line = batch.split('\n').map((l) => l.trim()).find((l) => l && l.trim());
  return line ? line.slice(0, 80) : '(bulk/continue)';
}

async function runFile(pool, filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const batches = splitBatches(content);
  console.log(`\n▶ Áp dụng ${path.basename(filePath)} (${batches.length} batches)...`);
  let ok = 0;
  for (const batch of batches) {
    try {
      await pool.request().query(batch);
      ok++;
    } catch (err) {
      console.error(`  ❌ Batch thất bại [${firstLine(batch)}]: ${err.message}`);
      throw err;
    }
  }
  console.log(`  ✅ Hoàn tất ${ok}/${batches.length} batches`);
  return ok;
}

(async () => {
  const drop = process.argv.includes('--drop');
  const pool = await sql.connect(sqlConfig);

  if (drop) {
    console.log(`🗑️ Drop database ${DB_NAME}...`);
    await pool.request().query(
      `IF DB_ID(N'${DB_NAME}') IS NOT NULL BEGIN
         ALTER DATABASE [${DB_NAME}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
         DROP DATABASE [${DB_NAME}];
       END`
    );
  }

  await runFile(pool, path.join(DB_DIR, 'schema_15_tables_mssql.sql'));
  await runFile(pool, path.join(DB_DIR, 'seed_15_tables_mssql.sql'));

  await pool.close();
  console.log('==============================================');
  console.log(`✅ SQL Server "${DB_NAME}" sẵn sàng!`);
  console.log('==============================================');
  process.exit(0);
})().catch((err) => {
  console.error('❌ db:init thất bại:', err.message);
  process.exit(1);
});