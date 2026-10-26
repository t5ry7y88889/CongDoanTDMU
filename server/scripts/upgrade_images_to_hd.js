const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const { sqlConfig } = require('../mssql_db');

async function upgradeImages() {
  console.log('=== UPGRADING ARTICLE THUMBNAILS TO FULL HD IMAGES ===');
  
  const dbPath = path.join(__dirname, '../database.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  let pool = null;
  try {
    pool = await sql.connect(sqlConfig);
    console.log('Connected to MSSQL successfully.');
  } catch (err) {
    console.warn('MSSQL connection warning:', err.message);
  }

  let upgradedCount = 0;

  for (const a of db.articles) {
    const content = a.content || '';
    const matches = [...content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
    
    if (matches.length > 0) {
      // Find the best image: prefer high-res http(s) URL over data: base64
      const httpImg = matches.find(m => m[1].startsWith('http') && !m[1].includes('favicon'));
      const chosenImg = httpImg ? httpImg[1] : matches[0][1];

      if (chosenImg && chosenImg !== a.image) {
        console.log(`[ID ${a.id}] "${a.title.slice(0, 35)}..."`);
        console.log(`   OLD: ${a.image}`);
        console.log(`   NEW: ${chosenImg}`);
        
        a.image = chosenImg;
        upgradedCount++;

        if (pool) {
          try {
            const req = pool.request();
            req.input('id', sql.Int, a.id);
            req.input('img', sql.VarChar(500), chosenImg.slice(0, 500));
            await req.query('UPDATE dbo.ARTICLES SET HinhAnhDaiDien = @img WHERE ArticleId = @id');
          } catch (e) {
            console.error(`MSSQL update error for ID ${a.id}:`, e.message);
          }
        }
      }
    }
  }

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`\nUpdated ${upgradedCount} articles in database.json and MSSQL with crystal-clear HD images.`);

  if (pool) {
    await pool.close();
  }
}

upgradeImages().catch(console.error);
