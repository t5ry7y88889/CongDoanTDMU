const cheerio = require('cheerio');

async function main() {
  const fetch = (await import('node-fetch')).default || globalThis.fetch;
  const sampleUrl = 'https://congdoan.tdmu.edu.vn/danh-muc/tin-tuc/tet-trung-thu-vui-hoi-trang-ram-danh-cho-con-can-bo-vien-chuc-giang-vien';
  const res = await fetch(sampleUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const h1 = $('h1');
  console.log('H1 parent:', h1.parent().prop('tagName'), 'class:', h1.parent().attr('class'), 'id:', h1.parent().attr('id'));
  console.log('H1 grandparent:', h1.parent().parent().prop('tagName'), 'class:', h1.parent().parent().attr('class'), 'id:', h1.parent().parent().attr('id'));
  
  // Print elements right after H1 or siblings
  h1.parent().children().each((i, el) => {
    console.log(`Child ${i}:`, $(el).prop('tagName'), 'class:', $(el).attr('class'), 'text slice:', $(el).text().trim().slice(0, 80));
  });
}

main().catch(console.error);
