const cheerio = require('cheerio');

async function main() {
  const fetch = (await import('node-fetch')).default || globalThis.fetch;
  const baseUrl = 'https://congdoan.tdmu.edu.vn';
  console.log(`Connecting to ${baseUrl}...`);
  
  const res = await fetch(baseUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  
  const html = await res.text();
  const $ = cheerio.load(html);
  
  console.log('Page Title:', $('title').text());
  
  // Find menus / navigation
  console.log('\n--- NAVIGATION MENUS ---');
  $('nav a, .menu a, #menu a, ul.nav a, header a').each((i, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href');
    if (text && href) {
      console.log(`- [${text}] => ${href}`);
    }
  });
  
  // Find article links
  console.log('\n--- ARTICLE / CONTENT LINKS ON HOMEPAGE ---');
  const articleLinks = new Set();
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    const title = $(el).attr('title') || $(el).text().trim();
    if (href && (href.includes('/tin-tuc/') || href.includes('/bai-viet/') || href.includes('/thong-bao/') || href.includes('/hoat-dong/') || href.includes('detail') || href.includes('id='))) {
      articleLinks.add(`${title} ===> ${href}`);
    }
  });
  
  articleLinks.forEach(l => console.log(l));
  
  // Let's also check all internal links
  console.log('\n--- ALL INTERNAL PATHS ---');
  const internalPaths = new Set();
  $('a').each((i, el) => {
    let href = $(el).attr('href');
    if (href && !href.startsWith('#') && !href.startsWith('javascript') && !href.startsWith('tel:') && !href.startsWith('mailto:')) {
      if (href.startsWith('/')) {
        internalPaths.add(href);
      } else if (href.includes('congdoan.tdmu.edu.vn')) {
        internalPaths.add(href);
      }
    }
  });
  
  internalPaths.forEach(p => console.log(p));
}

main().catch(err => console.error(err));
