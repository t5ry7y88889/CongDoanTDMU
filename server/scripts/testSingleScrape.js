const cheerio = require('cheerio');

async function scrapeArticle(url, categoryName, categoryId) {
  const fetch = (await import('node-fetch')).default || globalThis.fetch;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const title = $('h1').first().text().trim();
  const breadcrumb = $('.breadcrumb').text().trim().replace(/\s+/g, ' ');
  
  // Date and views
  let rawDate = '';
  let views = 0;
  $('span').each((i, el) => {
    const txt = $(el).text();
    if (txt.includes('/') && (txt.includes('202') || txt.includes('201') || txt.includes(':'))) {
      const match = txt.match(/(\d{1,2}\/\d{1,2}\/\d{4}(?:\s+\d{1,2}:\d{2})?)/);
      if (match) {
        rawDate = match[1];
        const vMatch = txt.match(/(\d+)\s*$/);
        if (vMatch) views = parseInt(vMatch[1]) || 0;
      }
    }
  });
  
  // Content HTML
  const contentEl = $('.noidungbaidang');
  
  // Normalize images inside contentEl to absolute URLs
  contentEl.find('img').each((i, el) => {
    let src = $(el).attr('src') || '';
    if (src.startsWith('/')) {
      $(el).attr('src', 'https://congdoan.tdmu.edu.vn' + src);
    }
  });
  
  // Normalize links inside content
  contentEl.find('a').each((i, el) => {
    let href = $(el).attr('href') || '';
    if (href.startsWith('/')) {
      $(el).attr('href', 'https://congdoan.tdmu.edu.vn' + href);
    }
  });
  
  const contentHtml = contentEl.html() ? contentEl.html().trim() : '';
  const textContent = contentEl.text().trim().replace(/\s+/g, ' ');
  const summary = textContent.slice(0, 250) + (textContent.length > 250 ? '...' : '');
  
  // First image as banner
  let featuredImg = '';
  const firstImg = contentEl.find('img').first();
  if (firstImg.length > 0) {
    featuredImg = firstImg.attr('src');
  }
  
  // Slug from url
  const slug = url.split('/').pop();
  
  return {
    title,
    slug,
    summary,
    content: contentHtml,
    image: featuredImg || 'https://congdoan.tdmu.edu.vn/img/logo-congdoan-2025.png',
    categoryName: categoryName || 'Tin tức',
    categoryId: categoryId || 1,
    viewsCount: views,
    publishedAt: rawDate || new Date().toISOString(),
    originalUrl: url
  };
}

async function main() {
  const testUrl = 'https://congdoan.tdmu.edu.vn/danh-muc/tin-tuc/tet-trung-thu-vui-hoi-trang-ram-danh-cho-con-can-bo-vien-chuc-giang-vien';
  const data = await scrapeArticle(testUrl, 'Tin Tức', 1);
  console.log('Title:', data.title);
  console.log('Date:', data.publishedAt);
  console.log('Views:', data.viewsCount);
  console.log('Image:', data.image);
  console.log('Summary:', data.summary);
  console.log('Content HTML length:', data.content.length);
  console.log('Content preview:', data.content.slice(0, 300));
}

main().catch(console.error);
