import os

mssql_path = r'Z:\Tailieu\DoAnCSNganh\tdmu-congdoan-web\server\mssql_db.js'
with open(mssql_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update viewsCount & likesCount with COALESCE in getArticlesFromDb
old_select = """          a.LuotXem AS viewsCount,
          a.LuotThich AS likesCount,"""
new_select = """          COALESCE(a.LuotXem, 0) AS viewsCount,
          COALESCE(a.LuotThich, 0) AS likesCount,"""

# 2. Add 'view' to incrementArticleReactionInDb
old_react = """      if (type === 'clap') {
        await req.query("UPDATE dbo.ARTICLES SET LuotVoTay = COALESCE(LuotVoTay, 0) + 1 WHERE ArticleId = @id");
      } else if (type === 'like') {
        await req.query("UPDATE dbo.ARTICLES SET LuotThich = COALESCE(LuotThich, 0) + 1 WHERE ArticleId = @id");
      }"""
new_react = """      if (type === 'clap') {
        await req.query("UPDATE dbo.ARTICLES SET LuotVoTay = COALESCE(LuotVoTay, 0) + 1 WHERE ArticleId = @id");
      } else if (type === 'like') {
        await req.query("UPDATE dbo.ARTICLES SET LuotThich = COALESCE(LuotThich, 0) + 1 WHERE ArticleId = @id");
      } else if (type === 'view') {
        await req.query("UPDATE dbo.ARTICLES SET LuotXem = COALESCE(LuotXem, 0) + 1 WHERE ArticleId = @id");
      }"""

# 3. Add getArticleStatsFromDb function
stats_func = """
async function getArticleStatsFromDb() {
  if (isMssqlConnected && mssqlPool) {
    try {
      const res = await mssqlPool.request().query(`
        SELECT 
          COUNT(*) AS totalArticles,
          COALESCE(SUM(CAST(COALESCE(LuotXem, 0) AS BIGINT)), 0) AS totalViews,
          COALESCE(SUM(CAST(COALESCE(LuotThich, 0) AS BIGINT)), 0) AS totalLikes,
          COALESCE(SUM(CAST(COALESCE(LuotVoTay, 0) AS BIGINT)), 0) AS totalClaps,
          COUNT(CASE WHEN TrangThai = 'published' THEN 1 END) AS publishedCount,
          COUNT(CASE WHEN TrangThai = 'draft' THEN 1 END) AS draftCount,
          COUNT(CASE WHEN TrangThai = 'pending' THEN 1 END) AS pendingCount
        FROM dbo.ARTICLES
      `);
      return res.recordset[0];
    } catch (err) {
      console.error('MSSQL Stats Query Error:', err.message);
    }
  }
  return null;
}
"""

content = content.replace(old_select, new_select)
content = content.replace(old_react, new_react)

if 'getArticleStatsFromDb,' not in content:
    content = content.replace('module.exports = {', stats_func + '\nmodule.exports = {\n  getArticleStatsFromDb,')

with open(mssql_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated server/mssql_db.js successfully!')
