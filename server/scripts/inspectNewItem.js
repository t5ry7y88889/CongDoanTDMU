const cheerio = require('cheerio');

async function main() {
  const fetch = (await import('node-fetch')).default || globalThis.fetch;
  const res = await fetch('https://congdoan.tdmu.edu.vn/danh-muc/tin-tuc');
  const html = await res.text();
  const $ = cheerio.load(html);
  const firstItem = $('.new_item').first();
  console.log('HTML of first .new_item:\n', firstItem.html());
}

main().catch(console.error);
