const db = require('../database.json');

const withoutContentImgs = db.articles.filter(a => {
  const matches = [...(a.content || '').matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
  return matches.length === 0;
});

console.log('Articles without images in content (' + withoutContentImgs.length + '):');
withoutContentImgs.forEach(a => {
  console.log(`ID: ${a.id} | Title: ${a.title} | Current img: ${a.image}`);
});
