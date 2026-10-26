const cheerio = require('cheerio');

async function main() {
  const fetch = (await import('node-fetch')).default || globalThis.fetch;
  const url = 'https://congdoan.tdmu.edu.vn/danh-muc/tin-tuc';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  console.log('--- FINDING ARTICLES IN COL-LG-9 ---');
  const mainCol = $('.col-lg-9, .col-md-9');
  console.log('Main col elements count:', mainCol.children().length);
  
  mainCol.children().slice(0, 10).each((i, el) => {
    console.log(`Child ${i}: <${el.tagName} class="${$(el).attr('class') || ''}"> text: ${$(el).text().trim().replace(/\s+/g, ' ').slice(0, 60)}`);
  });
}

main().catch(console.error);
