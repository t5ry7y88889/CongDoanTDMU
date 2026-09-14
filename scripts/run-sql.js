/* One-off migration runner: executes SQL batch files against the live DB. */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const sql = require('mssql');

const file = process.argv[2];
if (!file) { console.error("usage: node run-sql.js <file.sql>"); process.exit(1); }

const sqlText = fs.readFileSync(path.resolve(file), 'utf8');

const config = {
  server: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_DATABASE || 'TDMU_TradeUnion_DB',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'StrongP@ssw0rd',
  options: { encrypt: false, trustServerCertificate: true }
};

(async () => {
  try {
    const pool = await sql.connect(config);
    const batches = sqlText.split(/^\s*GO\s*$/gim).map(b => b.trim()).filter(Boolean);
    for (let i = 0; i < batches.length; i++) {
      await pool.request().batch(batches[i]);
      console.log(`batch ${i + 1}/${batches.length} OK`);
    }
    console.log('MIGRATION COMPLETED');
    await pool.close();
  } catch (err) {
    console.error('MIGRATION ERROR:', err.message);
    process.exit(1);
  }
})();