const db = require('../database.json');

const upgrades = [];

db.articles.forEach(a => {
  const matches = [...(a.content || '').matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
  if (matches.length > 0) {
    // Find first non-data: image if possible, or matches[0][1]
    const httpImg = matches.find(m => m[1].startsWith('http'));
    const chosen = httpImg ? httpImg[1] : matches[0][1];
    if (a.image !== chosen) {
      upgrades.push({
        id: a.id,
        title: a.title,
        oldImg: a.image,
        newImg: chosen
      });
    }
  }
});

console.log('Total articles to upgrade image:', upgrades.length);
console.log('Sample upgrades (first 5):');
upgrades.slice(0, 5).forEach(u => {
  console.log(`ID ${u.id}: ${u.title.slice(0, 40)}`);
  console.log('   OLD:', u.oldImg);
  console.log('   NEW:', u.newImg);
});
