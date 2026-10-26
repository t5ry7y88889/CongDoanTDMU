const cheerio = require('cheerio');

const categories = [
  { name: 'Tin tức', url: 'https://congdoan.tdmu.edu.vn/danh-muc/tin-tuc' },
  { name: 'Phúc lợi đoàn viên', url: 'https://congdoan.tdmu.edu.vn/danh-muc/phuc-loi-doan-vien' },
  { name: 'Công văn tuyên truyền', url: 'https://congdoan.tdmu.edu.vn/danh-muc/cong-van-tuyen-truyen' },
  { name: 'Kế hoạch hoạt động', url: 'https://congdoan.tdmu.edu.vn/danh-muc/ke-hoach-hoat-dong' },
  { name: 'Văn bản luật', url: 'https://congdoan.tdmu.edu.vn/danh-muc/van-ban-luat' },
  { name: 'Quyết định', url: 'https://congdoan.tdmu.edu.vn/danh-muc/quyet-dinh' },
  { name: 'Biểu mẫu', url: 'https://congdoan.tdmu.edu.vn/danh-muc/bieu-mau-2' }
];

async function main() {
  const fetch = (await import('node-fetch')).default || globalThis.fetch;
  
  for (const cat of categories) {
    try {
      const res = await fetch(cat.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const $ = cheerio.load(html);
      
      const articles = new Set();
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && (href.startsWith('/danh-muc/') || href.startsWith('/bai-viet/'))) {
          // ignore the category link itself
          if (href !== cat.url.replace('https://congdoan.tdmu.edu.vn', '') && href.split('/').length > 3) {
            articles.add(href);
          }
        }
      });
      
      console.log(`[${cat.name}] ${cat.url} => Found ${articles.size} article links`);
      const sample = [...articles].slice(0, 3);
      sample.forEach(s => console.log('   *', s));
    } catch (err) {
      console.error(`Error fetching ${cat.name}:`, err.message);
    }
  }
}

main().catch(console.error);
