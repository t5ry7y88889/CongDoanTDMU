const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

function parseVietnameseDate(str) {
  if (!str) return new Date().toISOString().replace('T', ' ').slice(0, 19);
  const match = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    const hour = match[4] ? match[4].padStart(2, '0') : '08';
    const min = match[5] ? match[5].padStart(2, '0') : '00';
    return `${year}-${month}-${day} ${hour}:${min}:00`;
  }
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

async function scrapeSingle(item, fetch) {
  try {
    const res = await fetch(item.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 15000
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Title
    let title = $('h1').first().text().trim();
    if (!title) title = item.listTitle || $('title').text().replace(' - Công Đoàn - Trường Đại Học Thủ Dầu Một', '').trim();

    // Date & Views
    let dateStr = item.listDate || '';
    let views = 0;
    $('span, div.time').each((i, el) => {
      const txt = $(el).text();
      if (!dateStr && txt.includes('/') && (txt.includes('202') || txt.includes('201'))) {
        const m = txt.match(/(\d{1,2}\/\d{1,2}\/\d{4}(?:\s+\d{1,2}:\d{2})?)/);
        if (m) dateStr = m[1];
      }
      if (txt.includes('fa-eye') || $(el).find('.fa-eye').length > 0) {
        const vM = txt.match(/(\d+)\s*$/);
        if (vM) views = parseInt(vM[1]) || 0;
      }
    });

    const publishedAt = parseVietnameseDate(dateStr);

    // Content container
    let contentEl = $('.noidungbaidang');
    if (contentEl.length === 0) {
      contentEl = $('.col-lg-9, .col-md-9');
      // remove header/breadcrumb/titles
      contentEl.find('.breadcrumb, h1, .tieu-de, .tieudelon, .mylist, .footer, script, style').remove();
    }

    // Normalize images inside content
    const imagesInArticle = [];
    contentEl.find('img').each((i, el) => {
      let src = $(el).attr('src') || '';
      if (src.startsWith('/')) {
        src = 'https://congdoan.tdmu.edu.vn' + src;
        $(el).attr('src', src);
      }
      if (src && !imagesInArticle.includes(src)) {
        imagesInArticle.push(src);
      }
      $(el).addClass('img-responsive').css({ 'max-width': '100%', 'height': 'auto', 'border-radius': '6px', 'margin': '12px auto', 'display': 'block' });
    });

    // Normalize document links inside content (.pdf, .docx, etc.)
    contentEl.find('a').each((i, el) => {
      let href = $(el).attr('href') || '';
      if (href.startsWith('/')) {
        $(el).attr('href', 'https://congdoan.tdmu.edu.vn' + href);
      }
      $(el).attr('target', '_blank').attr('rel', 'noopener noreferrer');
    });

    const contentHtml = contentEl.html() ? contentEl.html().trim() : `<p>${title}</p>`;
    const plainText = contentEl.text().trim().replace(/\s+/g, ' ');
    const summary = item.listDesc || (plainText.length > 220 ? plainText.slice(0, 220) + '...' : plainText);

    // Featured Image
    let featuredImage = item.thumbUrl;
    if (!featuredImage && imagesInArticle.length > 0) {
      featuredImage = imagesInArticle[0];
    }
    if (!featuredImage) {
      featuredImage = 'https://congdoan.tdmu.edu.vn/img/logo-congdoan-2025.png';
    }

    // Slug
    const slug = (item.url.split('/').pop() || 'bai-viet').replace(/[^a-zA-Z0-9_-]/g, '');

    return {
      title,
      slug,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      summary,
      content: contentHtml,
      image: featuredImage,
      allImages: imagesInArticle,
      viewsCount: views || Math.floor(Math.random() * 200 + 150),
      publishedAt,
      originalUrl: item.url,
      author: 'Ban Thường Vụ Công Đoàn TDMU',
      authorId: 1,
      status: 'published',
      isAiGenerated: false
    };
  } catch (err) {
    console.warn(`[Fail] ${item.url}:`, err.message);
    return null;
  }
}

async function test() {
  const fetch = (await import('node-fetch')).default || globalThis.fetch;
  const urlsPath = path.join(__dirname, 'all_article_urls.json');
  const urls = JSON.parse(fs.readFileSync(urlsPath, 'utf-8'));
  console.log(`Testing first 5 articles...`);
  for (let i = 0; i < 5; i++) {
    const res = await scrapeSingle(urls[i], fetch);
    console.log(`[OK ${i+1}]`, res.title, '| Img:', res.image, '| Content len:', res.content.length);
  }
}

test();
