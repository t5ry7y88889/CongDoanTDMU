const cheerio = require('cheerio');

const urls = [
  'https://congdoan.tdmu.edu.vn/danh-muc/phuc-loi-doan-vien',
  'https://congdoan.tdmu.edu.vn/danh-muc/cong-van-tuyen-truyen',
  'https://congdoan.tdmu.edu.vn/danh-muc/ke-hoach-hoat-dong',
  'https://congdoan.tdmu.edu.vn/danh-muc/van-ban-luat',
  'https://congdoan.tdmu.edu.vn/danh-muc/quyet-dinh',
  'https://congdoan.tdmu.edu.vn/danh-muc/bieu-mau-2'
];

async function main() {
  const fetch = (await import('node-fetch')).default || globalThis.fetch;
  for (const u of urls) {
    const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    const newItems = $('.new_item').length;
    const tables = $('table').length;
    const aCount = $('a[href*="/danh-muc/"]').length;
    console.log(`${u}: .new_item=${newItems}, tables=${tables}, links=${aCount}`);
    
    // If not new_item, check how items are listed
    if (newItems === 0) {
      console.log('   Sample elements in main col:');
      $('.col-lg-9, .col-md-9').find('a').slice(0, 5).each((i, el) => {
        console.log('   -', $(el).text().trim(), '=>', $(el).attr('href'));
      });
    }
  }
}

main().catch(console.error);
