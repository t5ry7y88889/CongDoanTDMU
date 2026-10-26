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
  console.log("Connected to MSSQL Database successfully!");

  const tablesRes = await pool.request().query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME
  `);

  console.log("\n=== ALL TABLES IN TDMU_TradeUnion_DB ===");
  for (const t of tablesRes.recordset) {
    console.log(`\nTable: ${t.TABLE_NAME}`);
    const cols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${t.TABLE_NAME}'
      ORDER BY ORDINAL_POSITION
    `);
    cols.recordset.forEach(c => {
      console.log(`  - ${c.COLUMN_NAME} (${c.DATA_TYPE}${c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : ''}) ${c.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
  }

  await pool.close();
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
