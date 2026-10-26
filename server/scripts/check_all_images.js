const db = require('../database.json');

let countWithContentImgs = 0;
let totalContentImgs = 0;
let updatedCount = 0;

db.articles.forEach(a => {
  const matches = [...(a.content || '').matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
  if (matches.length > 0) {
    countWithContentImgs++;
    totalContentImgs += matches.length;
    const firstHighRes = matches[0][1];
    if (a.image !== firstHighRes) {
      updatedCount++;
    }
  }
});

console.log('Total articles:', db.articles.length);
console.log('Articles with images in content:', countWithContentImgs);
console.log('Total content images:', totalContentImgs);
console.log('Articles whose thumbnail can be upgraded to full high-res:', updatedCount);
