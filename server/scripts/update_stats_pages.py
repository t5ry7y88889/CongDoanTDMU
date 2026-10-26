import os

# 1. Update tin-tuc.html
p_tt = r'Z:\Tailieu\DoAnCSNganh\tdmu-congdoan-web\public\tin-tuc.html'
with open(p_tt, 'r', encoding='utf-8') as f:
    c = f.read()

# Replace hardcoded stats
c = c.replace('Lượt thả tim: <strong>3,890</strong>', 'Lượt thả tim: <strong id="stat_likes">0</strong>')
c = c.replace('Tổng lượt xem: <strong>811,221</strong>', 'Tổng lượt xem: <strong id="stat_views">0</strong>')
c = c.replace('24 cán bộ đang đọc', '1 cán bộ đang đọc')
c = c.replace('<strong id="hero_views">450</strong>', '<strong id="hero_views">0</strong>')

# Hero views
c = c.replace(
    "if (heroViews) heroViews.innerText = (hero.viewsCount || hero.views || 450).toLocaleString('vi-VN');",
    "if (heroViews) heroViews.innerText = ((hero.viewsCount !== undefined && hero.viewsCount !== null) ? hero.viewsCount : (hero.views || 0)).toLocaleString('vi-VN');"
)

# Card views
c = c.replace(
    "${(a.viewsCount || a.views || 160).toLocaleString('vi-VN')} lượt xem",
    "${((a.viewsCount !== undefined && a.viewsCount !== null) ? a.viewsCount : (a.views || 0)).toLocaleString('vi-VN')} lượt xem"
)

with open(p_tt, 'w', encoding='utf-8') as f:
    f.write(c)
print('Updated tin-tuc.html')

# 2. Update bai-viet.html
p_bv = r'Z:\Tailieu\DoAnCSNganh\tdmu-congdoan-web\public\bai-viet.html'
with open(p_bv, 'r', encoding='utf-8') as f:
    cbv = f.read()

cbv = cbv.replace('<span id="artViews">162</span>', '<span id="artViews">0</span>')
cbv = cbv.replace('<span id="artLikeCount">128</span>', '<span id="artLikeCount">0</span>')
cbv = cbv.replace('<span id="artClapCount">64</span>', '<span id="artClapCount">0</span>')
cbv = cbv.replace(
    "if (viewsEl) viewsEl.innerText = a.viewsCount || a.LuotXem || 162;",
    """if (viewsEl) viewsEl.innerText = ((a.viewsCount !== undefined && a.viewsCount !== null) ? a.viewsCount : (a.LuotXem || 0)).toLocaleString('vi-VN');
          const likeEl = document.getElementById('artLikeCount');
          if (likeEl) likeEl.innerText = ((a.likesCount !== undefined && a.likesCount !== null) ? a.likesCount : (a.LuotThich || 0)).toLocaleString('vi-VN');
          const clapEl = document.getElementById('artClapCount');
          if (clapEl) clapEl.innerText = ((a.clapsCount !== undefined && a.clapsCount !== null) ? a.clapsCount : (a.LuotVoTay || 0)).toLocaleString('vi-VN');"""
)

# Connect toggleArtReaction to API
old_toggle = """    function toggleArtReaction(type) {
      if (type === 'like') {
        const btn = document.getElementById('btnLikeArt');
        const count = document.getElementById('artLikeCount');
        btn.classList.toggle('liked');
        count.innerText = parseInt(count.innerText) + (btn.classList.contains('liked') ? 1 : -1);
      } else if (type === 'clap') {
        const count = document.getElementById('artClapCount');
        count.innerText = parseInt(count.innerText) + 1;
      }
    }"""

new_toggle = """    async function toggleArtReaction(type) {
      if (!currentArticle || !currentArticle.id) return;
      try {
        const res = await fetch(`/api/articles/${currentArticle.id}/react`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reaction_type: type })
        }).then(r => r.json());

        if (res.success) {
          if (type === 'like') {
            const btn = document.getElementById('btnLikeArt');
            const count = document.getElementById('artLikeCount');
            if (btn) btn.classList.toggle('liked');
            if (count && res.likesCount !== undefined) count.innerText = res.likesCount.toLocaleString('vi-VN');
          } else if (type === 'clap') {
            const count = document.getElementById('artClapCount');
            if (count && res.clapsCount !== undefined) count.innerText = res.clapsCount.toLocaleString('vi-VN');
          }
          if (typeof syncGlobalStats === 'function') syncGlobalStats();
        }
      } catch (err) {
        console.warn('Lỗi gửi tương tác:', err);
      }
    }"""

cbv_norm = cbv.replace('\r\n', '\n')
old_toggle_norm = old_toggle.replace('\r\n', '\n')
new_toggle_norm = new_toggle.replace('\r\n', '\n')
if old_toggle_norm in cbv_norm:
    cbv_norm = cbv_norm.replace(old_toggle_norm, new_toggle_norm, 1)
    with open(p_bv, 'w', encoding='utf-8') as f:
        f.write(cbv_norm)
    print('Updated bai-viet.html')
else:
    print('toggleArtReaction not matched in bai-viet.html')

# 3. Update index.html & other pages
pages = ['index.html', 'gioi-thieu.html', 'van-ban.html', 'bieu-mau.html', 'lien-he.html']
for page in pages:
    fp = os.path.join(r'Z:\Tailieu\DoAnCSNganh\tdmu-congdoan-web\public', page)
    if os.path.exists(fp):
        with open(fp, 'r', encoding='utf-8') as f:
            cp = f.read()
        cp = cp.replace('<strong id="stat_online">12</strong>', '<strong id="stat_online">1</strong>')
        cp = cp.replace('<strong id="stat_views">811,221</strong>', '<strong id="stat_views">0</strong>')
        cp = cp.replace('<strong>811,221</strong>', '<strong id="stat_views">0</strong>')
        cp = cp.replace('<strong>3,890</strong>', '<strong id="stat_likes">0</strong>')
        cp = cp.replace('totalViews || (data.data && data.data.tong_luot_xem) || 811221', 'totalViews || (data.data && data.data.tong_luot_xem) || 0')
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(cp)
        print('Updated', page)
