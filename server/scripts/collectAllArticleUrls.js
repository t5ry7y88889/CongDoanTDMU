const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const CATEGORY_MAP = [
  { name: 'Tin tức', slug: 'tin-tuc', id: 1, url: 'https://congdoan.tdmu.edu.vn/danh-muc/tin-tuc' },
  { name: 'Phúc lợi đoàn viên', slug: 'phuc-loi-doan-vien', id: 2, url: 'https://congdoan.tdmu.edu.vn/danh-muc/phuc-loi-doan-vien' },
  { name: 'Công văn tuyên truyền', slug: 'cong-van-tuyen-truyen', id: 3, url: 'https://congdoan.tdmu.edu.vn/danh-muc/cong-van-tuyen-truyen' },
  { name: 'Kế hoạch hoạt động', slug: 'ke-hoach-hoat-dong', id: 4, url: 'https://congdoan.tdmu.edu.vn/danh-muc/ke-hoach-hoat-dong' },
  { name: 'Văn bản luật', slug: 'van-ban-luat', id: 5, url: 'https://congdoan.tdmu.edu.vn/danh-muc/van-ban-luat' },
  { name: 'Quyết định', slug: 'quyet-dinh', id: 6, url: 'https://congdoan.tdmu.edu.vn/danh-muc/quyet-dinh' },
  { name: 'Biểu mẫu', slug: 'bieu-mau', id: 7, url: 'https://congdoan.tdmu.edu.vn/danh-muc/bieu-mau-2' },
  // Giới thiệu
  { name: 'Giới thiệu', slug: 'gioi-thieu', id: 8, url: 'https://congdoan.tdmu.edu.vn/bai-viet/gioi-thieu', isDirect: true },
  { name: 'Ban thường vụ', slug: 'ban-thuong-vu', id: 9, url: 'https://congdoan.tdmu.edu.vn/bai-viet/ban-thuong-vu', isDirect: true },
  { name: 'Ban chấp hành', slug: 'ban-chap-hanh', id: 10, url: 'https://congdoan.tdmu.edu.vn/bai-viet/ban-chap-hanh-1', isDirect: true },
  { name: 'Ủy ban kiểm tra', slug: 'uy-ban-kiem-tra', id: 11, url: 'https://congdoan.tdmu.edu.vn/bai-viet/uy-ban-kiem-tra-1', isDirect: true },
  { name: 'Công đoàn bộ phận và Tổ công đoàn', slug: 'to-cong-doan', id: 12, url: 'https://congdoan.tdmu.edu.vn/bai-viet/cong-doan-bo-phan-va-to-cong-doan', isDirect: true },
  { name: 'Liên hệ', slug: 'lien-he', id: 13, url: 'https://congdoan.tdmu.edu.vn/bai-viet/lien-he', isDirect: true }
];

async function main() {
  const fetch = (await import('node-fetch')).default || globalThis.fetch;
  const allUrls = new Map(); // url -> { categoryName, categoryId, categorySlug, thumbUrl, listTitle, listDate, listDesc }
  
  console.log('=== BẮT ĐẦU THU THẬP TẤT CẢ LINK BÀI VIẾT TỪ CONGDOAN.TDMU.EDU.VN ===\n');

  for (const cat of CATEGORY_MAP) {
    if (cat.isDirect) {
      allUrls.set(cat.url, {
        url: cat.url,
        categoryName: cat.name,
        categoryId: cat.id,
        categorySlug: cat.slug,
        thumbUrl: '',
        listTitle: cat.name,
        listDate: '2026-01-01',
        listDesc: ''
      });
      continue;
    }

    console.log(`Đang quét chuyên mục: [${cat.name}] ${cat.url}`);
    try {
      const res = await fetch(cat.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const $ = cheerio.load(html);

      // Check items with .new_item (Tin tức)
      $('.new_item').each((i, el) => {
        const a = $(el).find('.new_item_title a');
        let href = a.attr('href');
        if (href) {
          if (!href.startsWith('http')) href = 'https://congdoan.tdmu.edu.vn' + href;
          const title = a.text().trim();
          let imgSrc = $(el).find('img.new_item_img').attr('src') || '';
          if (imgSrc && !imgSrc.startsWith('http')) imgSrc = 'https://congdoan.tdmu.edu.vn' + imgSrc;
          const time = $(el).find('.new_item_time').text().trim();
          const desc = $(el).find('.new_item_desc').text().trim();
          
          allUrls.set(href, {
            url: href,
            categoryName: cat.name,
            categoryId: cat.id,
            categorySlug: cat.slug,
            thumbUrl: imgSrc,
            listTitle: title,
            listDate: time,
            listDesc: desc
          });
        }
      });

      // Check other items in main column (Văn bản, kế hoạch, quyết định, phúc lợi...)
      $('.col-lg-9 a, .col-md-9 a').each((i, el) => {
        let href = $(el).attr('href');
        if (href && (href.startsWith('/danh-muc/') || href.startsWith('/bai-viet/'))) {
          const parts = href.split('/').filter(Boolean);
          if (parts.length >= 3) {
            if (!href.startsWith('http')) href = 'https://congdoan.tdmu.edu.vn' + href;
            if (!allUrls.has(href)) {
              const title = $(el).text().trim().split('\n')[0].trim();
              const fullText = $(el).text().trim().replace(/\s+/g, ' ');
              let dateMatch = fullText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
              
              allUrls.set(href, {
                url: href,
                categoryName: cat.name,
                categoryId: cat.id,
                categorySlug: cat.slug,
                thumbUrl: '',
                listTitle: title,
                listDate: dateMatch ? dateMatch[1] : '',
                listDesc: ''
              });
            }
          }
        }
      });

    } catch (err) {
      console.error(`Lỗi khi quét [${cat.name}]:`, err.message);
    }
  }

  console.log(`\n===> TỔNG CỘNG TÌM THẤY: ${allUrls.size} BÀI BÁO & VĂN BẢN DUY NHẤT!`);
  
  const outputData = Array.from(allUrls.values());
  const outPath = path.join(__dirname, 'all_article_urls.json');
  fs.writeFileSync(outPath, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`Đã lưu danh sách URL vào: ${outPath}`);
}

main().catch(console.error);
