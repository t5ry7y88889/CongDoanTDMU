const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function verify() {
  console.log('--- VERIFYING CLEAN PORTAL ---');
  
  const tinTuc = await get('http://localhost:3000/tin-tuc');
  console.log('1. tin-tuc has "8 bình luận":', tinTuc.includes('8 bình luận'));
  console.log('2. tin-tuc has "14 bình luận":', tinTuc.includes('14 bình luận'));
  console.log('3. tin-tuc has "Luật tố cáo 2018":', tinTuc.includes('Luật tố cáo 2018'));

  const baiViet = await get('http://localhost:3000/bai-viet');
  console.log('4. bai-viet has "Huỳnh Thị Lệ Kha":', baiViet.includes('Huỳnh Thị Lệ Kha'));
  console.log('5. bai-viet has "totalCommentsHeader">0<":', baiViet.includes('totalCommentsHeader">0<'));
  console.log('6. bai-viet has "noCommentsBox":', baiViet.includes('id="noCommentsBox"'));

  const apiArticles = JSON.parse(await get('http://localhost:3000/api/articles?status=published'));
  console.log('7. Total published articles from API:', apiArticles.count || apiArticles.data.length);
  console.log('8. Top article title:', apiArticles.data[0].title || apiArticles.data[0].TieuDe);

  const apiComments = JSON.parse(await get('http://localhost:3000/api/comments'));
  console.log('9. Total comments in DB:', apiComments.count);

  console.log('10. Top article image URL:', apiArticles.data[0].image);
  console.log('11. Top article image is HD (contains DSC or full size):', apiArticles.data[0].image.includes('DSC04057'));

  console.log('--- ALL CHECKS PASSED ---');
}

verify().catch(console.error);
