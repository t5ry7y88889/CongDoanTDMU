const db = require('../database.json');

for (const id of [4, 6, 2, 3, 1, 5, 7]) {
  const art = db.articles.find(a => a.id === id);
  if (!art) continue;
  console.log(`\n=== Article ID: ${id} - ${art.title} ===`);
  console.log('Thumbnail URL:', art.image);
  
  const matches = [...(art.content || '').matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
  console.log('Images inside body HTML (' + matches.length + ' images):');
  matches.forEach((m, idx) => {
    console.log(`  [${idx}] ${m[1]}`);
  });
}
