const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const { sqlConfig } = require('../mssql_db');

async function syncMssqlImages() {
  const dbPath = path.join(__dirname, '../database.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  const pool = await sql.connect(sqlConfig);
  console.log('Connected to MSSQL successfully.');

  let count = 0;
  for (const a of db.articles) {
    if (a.image) {
      const req = pool.request();
      req.input('id', sql.Int, a.id);
      req.input('img', sql.VarChar(500), a.image.slice(0, 500));
      await req.query('UPDATE dbo.ARTICLES SET HinhAnhDaiDien = @img WHERE ArticleId = @id');
      count++;
    }
  }

  console.log(`Successfully synced ${count} images to MSSQL dbo.ARTICLES.`);
  await pool.close();
}

syncMssqlImages().catch(console.error);
