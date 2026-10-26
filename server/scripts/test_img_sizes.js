const http = require('http');
const https = require('https');
const db = require('../database.json');

async function getImgSize(url) {
  if (!url || typeof url !== 'string') return { error: 'invalid' };
  if (url.startsWith('data:')) {
    return { length: url.length, status: 200, isData: true };
  }
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, (res) => {
        let data = [];
        res.on('data', chunk => data.push(chunk));
        res.on('end', () => {
          const buf = Buffer.concat(data);
          resolve({ length: buf.length, status: res.statusCode });
        });
      });
      req.on('error', (e) => resolve({ error: e.message }));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ error: 'timeout' });
      });
    } catch (e) {
      resolve({ error: e.message });
    }
  });
}

async function test() {
  const top15 = db.articles.slice(0, 15);
  for (const a of top15) {
    const matches = [...(a.content || '').matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
    const firstContentImg = matches.length > 0 ? matches[0][1] : null;
    console.log(`\nID ${a.id}: ${a.title.slice(0, 45)}...`);
    console.log('  Thumb:', (a.image || '').slice(0, 70));
    const thumbInfo = await getImgSize(a.image);
    console.log(`    -> Thumb size: ${(thumbInfo.length / 1024).toFixed(1)} KB, status: ${thumbInfo.status}`);
    if (firstContentImg) {
      console.log('  First Content Img:', firstContentImg.slice(0, 70));
      const contentInfo = await getImgSize(firstContentImg);
      console.log(`    -> Content Img size: ${(contentInfo.length / 1024).toFixed(1)} KB, status: ${contentInfo.status}`);
    }
  }
}

test();
