const sql = require('mssql');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const sqlConfig = {
  server: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '56205'),
  database: process.env.DB_DATABASE || 'TDMU_TradeUnion_DB',
  user: process.env.DB_USER || 'node_app',
  password: process.env.DB_PASSWORD || 'TDMUNode@2026',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function main() {
  try {
    const pool = await sql.connect(sqlConfig);
    console.log('MSSQL Connected successfully!');
    const res = await pool.request().query("SELECT ArticleId, TieuDe, CategoryId, TrangThai FROM dbo.ARTICLES ORDER BY ArticleId DESC");
    console.log('Total articles in dbo.ARTICLES:', res.recordset.length);
    console.log('Sample articles:');
    res.recordset.slice(0, 15).forEach(r => {
      console.log(`- #${r.ArticleId}: ${r.TieuDe} [status: ${r.TrangThai}]`);
    });
    
    // Check categories in dbo.CATEGORIES
    const cats = await pool.request().query("SELECT CategoryId, TenChuyenMuc, Slug FROM dbo.CATEGORIES ORDER BY CategoryId");
    console.log('\nCategories in dbo.CATEGORIES:');
    cats.recordset.forEach(c => console.log(`- #${c.CategoryId}: ${c.TenChuyenMuc} (${c.Slug})`));
    
    process.exit(0);
  } catch (err) {
    console.error('MSSQL Error:', err.message);
    process.exit(1);
  }
}

main();
