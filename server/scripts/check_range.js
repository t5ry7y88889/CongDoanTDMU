const db = require('../database.json');
for (let id = 85; id <= 105; id++) {
  const a = db.articles.find(x => x.id === id);
  if (a) {
    console.log(`[ID ${a.id}] [${a.categoryName}] ContentLen: ${a.content ? a.content.length : 0} | Title: ${a.title.slice(0, 50)}`);
  }
}
