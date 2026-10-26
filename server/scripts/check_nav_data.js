const sql = require('mssql');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const sqlConfig = {
  server: (process.env.DB_HOST || '127.0.0.1').trim(),
  port: parseInt(String(process.env.DB_PORT || '56205').trim()),
  database: (process.env.DB_DATABASE || 'TDMU_TradeUnion_DB').trim(),
  user: (process.env.DB_USER || 'node_app').trim(),
  password: (process.env.DB_PASSWORD || 'TDMUNode@2026').trim(),
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function main() {
  const pool = await sql.connect(sqlConfig);
  console.log("=== CATEGORIES ===");
  const cats = await pool.request().query('SELECT * FROM dbo.CATEGORIES ORDER BY ThuTu, CategoryId');
  console.log(cats.recordset);

  console.log("\n=== ORGANIZATIONS ===");
  const orgs = await pool.request().query('SELECT * FROM dbo.ORGANIZATIONS ORDER BY ThuTuHienThi');
  console.log(orgs.recordset);

  console.log("\n=== UNION_BRANCHES ===");
  const branches = await pool.request().query('SELECT * FROM dbo.UNION_BRANCHES');
  console.log(branches.recordset);

  await pool.close();
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
