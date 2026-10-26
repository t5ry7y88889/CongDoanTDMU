const cheerio = require('cheerio');

async function main() {
  const fetch = (await import('node-fetch')).default || globalThis.fetch;
  const url = 'https://congdoan.tdmu.edu.vn/danh-muc/tin-tuc';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  console.log('--- FINDING ITEMS ON CATEGORY LIST ---');
  // Look at divs that contain an article link and image
  $('div').each((i, el) => {
    const a = $(el).find('a[href^="/danh-muc/tin-tuc/"]');
    const img = $(el).find('img');
    if (a.length > 0 && img.length > 0 && $(el).find('div').length < 3) {
      console.log('Item found:');
      console.log('   Class:', $(el).attr('class'));
      console.log('   Link:', a.attr('href'));
      console.log('   Title:', a.text().trim() || a.attr('title'));
      console.log('   Img:', img.attr('src'));
      console.log('   Text:', $(el).text().trim().replace(/\s+/g, ' ').slice(0, 100));
      return false; // break after first
    }
  });
}

main().catch(console.error);
