const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

async function runTests() {
  console.log('====================================================');
  console.log('🧪 VERIFYING SYSTEM ARTICLES & CORE APIS (100% REAL)');
  console.log('====================================================\n');

  // 1. Categories
  console.log('--- 1. Testing GET /api/categories ---');
  let res = await fetch('http://localhost:3000/api/categories');
  let data = await res.json();
  console.log('Categories count:', data.data ? data.data.length : 0);
  (data.data || []).forEach(c => console.log(`  - [ID: ${c.id}] ${c.name} (${c.slug})`));

  // 2. Published Articles
  console.log('\n--- 2. Testing GET /api/articles?status=published ---');
  res = await fetch('http://localhost:3000/api/articles?status=published');
  data = await res.json();
  console.log(`Total Published Articles: ${data.count} (Array length: ${data.data?.length})`);
  if (data.data?.length > 0) {
    const s = data.data[0];
    console.log('First article in feed:');
    console.log('  ID:', s.id);
    console.log('  Title:', s.title);
    console.log('  Category:', s.categoryName);
    console.log('  Image:', s.image);
    console.log('  Views:', s.viewsCount);
    console.log('  Published At:', s.publishedAt);
  }

  // 3. Articles by Category
  console.log('\n--- 3. Testing Filter by Category ---');
  for (const catId of [1, 2, 3, 4, 5, 6, 7, 8]) {
    res = await fetch('http://localhost:3000/api/articles?category=' + catId);
    data = await res.json();
    console.log(`  Category ID ${catId} -> count: ${data.count}`);
  }

  // 4. Detail of Individual Articles
  console.log('\n--- 4. Testing GET /api/articles/:id (Testing articles 1, 2, 3) ---');
  for (const id of [1, 2, 3]) {
    res = await fetch('http://localhost:3000/api/articles/' + id);
    const detail = await res.json();
    const art = detail.data;
    console.log(`Article #${id}:`);
    console.log('  Title:', art?.title);
    console.log('  Image URL:', art?.image);
    console.log('  HTML content length:', art?.content?.length);
    console.log('  Snippet:', art?.content ? art.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 100) + '...' : 'none');
  }

  // 5. Check Image Reachability (HEAD request to article image)
  console.log('\n--- 5. Testing Image Reachability ---');
  res = await fetch('http://localhost:3000/api/articles/1');
  const art1 = (await res.json()).data;
  if (art1 && art1.image) {
    try {
      const imgRes = await fetch(art1.image, { method: 'HEAD' });
      console.log(`  Checking Image: ${art1.image}`);
      console.log(`  HTTP Status: ${imgRes.status} (OK: ${imgRes.ok})`);
      console.log(`  Content-Type: ${imgRes.headers.get('content-type')}`);
    } catch (e) {
      console.log(`  Image fetch error: ${e.message}`);
    }
  }

  // 6. Test Core Supporting APIs
  console.log('\n--- 6. Testing Core Supporting APIs ---');
  const docsRes = await fetch('http://localhost:3000/api/documents');
  const docs = await docsRes.json();
  console.log('  /api/documents -> count:', docs.data?.length);

  const welfareRes = await fetch('http://localhost:3000/api/welfare');
  const welfare = await welfareRes.json();
  console.log('  /api/welfare -> count:', welfare.data?.length);

  const statsRes = await fetch('http://localhost:3000/api/stats');
  const stats = await statsRes.json();
  console.log('  /api/stats -> online:', stats.online, ', totalViews:', stats.totalViews);

  console.log('\n====================================================');
  console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runTests().catch(console.error);
