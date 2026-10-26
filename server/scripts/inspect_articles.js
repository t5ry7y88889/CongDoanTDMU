const db = require('../database.json');

// Check content lengths across all 235 articles
const withContent = db.articles.filter(a => a.content && a.content.trim().length > 150);
console.log('Total articles with real content (>150 chars):', withContent.length);

const withoutContent = db.articles.filter(a => !a.content || a.content.trim().length <= 150);
console.log('Total articles with NO content or <150 chars:', withoutContent.length);

console.log('\n--- Breakdown of withContent by Category ---');
const catCount = {};
withContent.forEach(a => {
  catCount[a.categoryName] = (catCount[a.categoryName] || 0) + 1;
});
console.log(catCount);

console.log('\n--- First 20 articles in withContent ---');
withContent.slice(0, 20).forEach(a => {
  console.log(`[ID ${a.id}] [${a.categoryName}] ${a.title.slice(0, 50)} | ${a.content.length} chars | Img: ${a.image.slice(0, 45)}`);
});

console.log('\n--- Check articles 1 to 95 ---');
const first95 = db.articles.filter(a => a.id <= 95);
const first95WithContent = first95.filter(a => a.content && a.content.length > 150);
console.log(`Articles 1-95 with content: ${first95WithContent.length} / ${first95.length}`);
