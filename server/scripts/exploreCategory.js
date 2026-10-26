const cheerio = require('cheerio');

async function main() {
  const fetch = (await import('node-fetch')).default || globalThis.fetch;
  const url = 'https://congdoan.tdmu.edu.vn/danh-muc/tin-tuc';
  console.log(`Fetching ${url}...`);
  
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  console.log('Category Title:', $('title').text());
  
  // Articles in category
  console.log('\n--- ARTICLES FOUND ON PAGE 1 ---');
  const articles = [];
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.startsWith('/danh-muc/tin-tuc/')) {
      const text = $(el).text().trim();
      articles.push({ text, href });
    }
  });
  
  const uniqueArticles = [...new Map(articles.map(item => [item.href, item])).values()];
  console.log('Count:', uniqueArticles.length);
  uniqueArticles.forEach(a => console.log(a.href, '->', a.text.replace(/\s+/g, ' ').slice(0, 80)));
  
  // Pagination
  console.log('\n--- PAGINATION ---');
  $('a').each((i, el) => {
    const href = $(el).attr('href') || '';
    if (href.includes('page') || href.includes('trang') || href.includes('?') || href.includes('tin-tuc/')) {
      const text = $(el).text().trim();
      if (/^\d+$/.test(text) || text.includes('Trang') || text.includes('Next') || text.includes('»') || text.includes('Sau')) {
        console.log('Page link:', text, '=>', href);
      }
    }
  });
  
  // Also check sample article HTML structure
  if (uniqueArticles.length > 0) {
    const sampleArticleUrl = 'https://congdoan.tdmu.edu.vn' + uniqueArticles[0].href;
    console.log(`\n--- FETCHING SAMPLE ARTICLE: ${sampleArticleUrl} ---`);
    const artRes = await fetch(sampleArticleUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const artHtml = await artRes.text();
    const $art = cheerio.load(artHtml);
    
    console.log('Article Title:', $art('title').text());
    console.log('H1:', $art('h1').text().trim());
    console.log('Date:', $art('.date, .time, .post-date, .created, .entry-date, span:contains("202")').text().trim().replace(/\s+/g, ' ').slice(0, 100));
    console.log('Images inside article:', $art('article img, .content img, #content img, .detail img, img').map((i, el) => $art(el).attr('src')).get().slice(0, 5));
    console.log('Main Content Selector Candidates:');
    ['article', '.detail', '.post-detail', '.entry-content', '.content', '#content', '.noidung', '.noi-dung', '.main-content'].forEach(sel => {
      console.log(`Selector "${sel}": text length =`, $art(sel).text().trim().length);
    });
  }
}

main().catch(err => console.error(err));
