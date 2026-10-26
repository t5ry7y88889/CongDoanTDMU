const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sqlConfig = {
  user: process.env.DB_USER || 'node_app',
  password: process.env.DB_PASSWORD || 'TDMUNode@2026',
  database: process.env.DB_DATABASE || 'TDMU_TradeUnion_DB',
  server: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT) || 56205,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function resetAllStats() {
  try {
    const pool = await sql.connect(sqlConfig);
    console.log('Connected to MSSQL successfully!');

    const updateRes = await pool.request().query(`
      UPDATE dbo.ARTICLES 
      SET LuotXem = 0, LuotThich = 0, LuotVoTay = 0;
    `);
    console.log('UPDATE dbo.ARTICLES rows affected:', updateRes.rowsAffected);

    const checkRes = await pool.request().query(`
      SELECT 
        COUNT(*) AS totalArticles,
        COALESCE(SUM(CAST(LuotXem AS BIGINT)), 0) AS totalViews,
        COALESCE(SUM(CAST(LuotThich AS BIGINT)), 0) AS totalLikes,
        COALESCE(SUM(CAST(LuotVoTay AS BIGINT)), 0) AS totalClaps
      FROM dbo.ARTICLES;
    `);

    console.log('DATABASE STATS AFTER RESET:', checkRes.recordset[0]);
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('Lỗi kết nối / cập nhật MSSQL:', err.message);
    process.exit(1);
  }
}

resetAllStats();
