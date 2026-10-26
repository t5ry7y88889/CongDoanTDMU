const db = require('../database.json');

console.log('--- Analyzing Articles 1 to 100 ---');
const first100 = db.articles.filter(a => a.id <= 95);
console.log(`Total in range 1-95: ${first100.length}`);

// Filter only those with real substantive content (> 150 chars)
const realNews = first100.filter(a => a.content && a.content.trim().length > 150);
console.log(`Real articles with rich content: ${realNews.length}`);

realNews.forEach((a, i) => {
  console.log(`${i + 1}. [ID: ${a.id}] ${a.title.slice(0, 65)} | Date: ${a.publishedAt || a.createdAt} | Img: ${a.image ? 'YES' : 'NO'}`);
});
