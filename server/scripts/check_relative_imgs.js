const db = require('../database.json');

let relativeImgs = 0;
db.articles.forEach(a => {
  if (a.image && !a.image.startsWith('http') && !a.image.startsWith('data:') && !a.image.startsWith('/')) {
    console.log('Relative thumbnail:', a.id, a.image);
    relativeImgs++;
  }
  const matches = [...(a.content || '').matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
  matches.forEach(m => {
    const src = m[1];
    if (!src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('/')) {
      console.log('Relative content img:', a.id, src);
      relativeImgs++;
    }
  });
});

console.log('Total relative images found:', relativeImgs);
