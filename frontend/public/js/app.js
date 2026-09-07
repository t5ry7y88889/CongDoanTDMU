// Public Portal Enterprise Logic connected directly to REST API Backend
let currentArticles = [];

document.addEventListener('DOMContentLoaded', () => {
  loadArticles('all');
  loadUpcomingEvents();
  setupFilterTabs();
  setupSearch();
  setupModal();
});

async function loadArticles(category = 'all', search = '') {
  const container = document.getElementById('article_container');
  if (container) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
        <i class="fa-solid fa-circle-notch fa-spin fa-2x" style="color: var(--primary-color);"></i>
        <p style="margin-top: 10px; color: var(--text-muted);">Đang kết nối CSDL và tải tin tức mới nhất...</p>
      </div>
    `;
  }

  try {
    const res = await API.getArticles(category, 'published', search);
    if (res.success) {
      currentArticles = res.data;
      renderArticles(currentArticles);
      if (currentArticles.length > 0 && category === 'all' && !search) {
        updateHeroBanner(currentArticles[0]);
      }
    }
  } catch (err) {
    console.error("Error loading articles:", err);
  }
}

function updateHeroBanner(art) {
  if (!art) return;
  const titleEl = document.querySelector('.hero-title');
  const metaEl = document.querySelector('.hero-meta');
  const imgEl = document.querySelector('.hero-image');

  if (titleEl) titleEl.innerText = art.title;
  if (imgEl && art.image) imgEl.src = art.image;
  if (metaEl) {
    metaEl.innerHTML = `
      <span><i class="fa-regular fa-calendar"></i> ${art.createdAt || '2026-08-21'}</span>
      <span><i class="fa-solid fa-user-pen"></i> ${art.author || 'Ban Thường Vụ Công Đoàn'}</span>
      <span><i class="fa-regular fa-eye"></i> ${art.viewsCount || 0} lượt xem</span>
    `;
  }
}

function renderArticles(articles) {
  const container = document.getElementById('article_container');
  if (!container) return;

  if (articles.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
        <i class="fa-solid fa-folder-open fa-2x text-muted"></i>
        <p class="mt-2 text-muted fw-semibold">Chưa có bài viết nào thuộc chuyên mục này.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = articles.map(art => `
    <div class="news-item" id="article_card_${art.id}">
      <img src="${art.image || 'images/banner.jpg'}" alt="${art.title}" class="news-thumb">
      <div class="flex-grow-1">
        <a href="javascript:void(0)" onclick="openArticleModal(${art.id})" class="news-title fw-bold">${art.title}</a>
        <div class="news-date d-flex align-items-center gap-2 mt-1">
          <span><i class="fa-regular fa-calendar me-1"></i> ${art.createdAt || '2026-08-24'}</span>
          <span class="badge bg-primary-subtle text-primary border">${art.categoryName || 'Tin hoạt động'}</span>
          ${art.isAiGenerated ? '<span class="badge bg-success-subtle text-success border"><i class="fa-solid fa-wand-magic-sparkles"></i> AI</span>' : ''}
          <span class="ms-auto text-muted"><i class="fa-regular fa-eye me-1"></i> ${art.viewsCount || 0}</span>
        </div>
        <p class="small text-muted mb-2 mt-1" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${art.summary || ''}
        </p>
        <button class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 12px;" onclick="openArticleModal(${art.id})">
          <i class="fa-regular fa-eye me-1"></i> Đọc tin & AI Sapo
        </button>
      </div>
    </div>
  `).join('');
}

async function likeArticle(id) {
  try {
    const res = await API.likeArticle(id);
    if (res.success) {
      const el = document.getElementById(`like_count_${id}`);
      if (el) el.innerText = res.likesCount;
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadUpcomingEvents() {
  const widgetList = document.getElementById('events_widget_list');
  if (!widgetList) return;

  try {
    const res = await API.getEvents();
    if (res.success && res.data.length > 0) {
      widgetList.innerHTML = res.data.map(ev => `
        <li class="widget-item" style="padding: 10px 0; border-bottom: 1px solid #E2E8F0;">
          <strong style="color: var(--primary-color); font-size: 13.5px; display: block;">${ev.title}</strong>
          <span style="font-size: 11.5px; color: var(--text-muted); display: block; margin-top: 2px;">
            <i class="fa-regular fa-clock"></i> ${ev.startTime} | <i class="fa-solid fa-location-dot"></i> ${ev.location}
          </span>
        </li>
      `).join('');
    } else {
      widgetList.innerHTML = `<li style="font-size: 12px; color: var(--text-muted); padding: 10px 0;">Chưa có sự kiện mới.</li>`;
    }
  } catch (err) {
    console.error(err);
  }
}

function setupFilterTabs() {
  const container = document.getElementById('category_tabs');
  if (!container) return;

  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-item')) {
      document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');

      const category = e.target.dataset.category || 'all';
      loadArticles(category);
    }
  });
}

function setupSearch() {
  const input = document.getElementById('search_input');
  if (!input) return;

  let timeout = null;
  input.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      loadArticles('all', e.target.value.trim());
    }, 300);
  });
}

async function openArticleModal(id) {
  try {
    const res = await API.getArticleById(id);
    if (res.success) {
      const art = res.data;
      document.getElementById('modal_badge').innerText = art.categoryName;
      document.getElementById('modal_title').innerText = art.title;
      document.getElementById('modal_ai_summary').innerText = art.summary || art.title;
      document.getElementById('modal_img').src = art.image || 'images/banner.jpg';
      document.getElementById('modal_body').innerHTML = art.content || art.title;
      document.getElementById('modal_meta').innerText = `${art.author} · ${art.createdAt} · ${art.viewsCount} lượt xem`;

      renderComments(art.comments || []);
      window.currentModalArticleId = art.id;

      document.getElementById('article_modal').classList.add('active');
    }
  } catch (err) {
    console.error(err);
  }
}

function renderComments(comments) {
  const list = document.getElementById('modal_comment_list');
  if (!list) return;

  if (comments.length === 0) {
    list.innerHTML = `<p style="font-size: 13px; color: var(--text-muted); font-style: italic;">Chưa có bình luận nào. Hãy là người đầu tiên trao đổi!</p>`;
    return;
  }

  list.innerHTML = comments.map(c => `
    <div style="background: white; padding: 10px 12px; border-radius: 6px; border: 1px solid #E2E8F0; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; font-size: 12px;">
        <strong style="color: var(--primary-color);">${c.authorName}</strong>
        <span style="color: var(--text-muted);">${c.createdAt}</span>
      </div>
      <p style="font-size: 13px; margin-top: 4px; color: var(--text-main);">${c.commentText}</p>
    </div>
  `).join('');
}

async function addComment() {
  if (!window.currentModalArticleId) return;

  const authorName = document.getElementById('comment_author_input').value.trim();
  const commentText = document.getElementById('comment_text_input').value.trim();

  if (!commentText) {
    alert("Vui lòng nhập nội dung bình luận!");
    return;
  }

  try {
    const res = await API.addComment(window.currentModalArticleId, authorName, commentText);
    if (res.success) {
      document.getElementById('comment_text_input').value = "";
      openArticleModal(window.currentModalArticleId);
    }
  } catch (err) {
    console.error(err);
  }
}

function setupModal() {
  const backdrop = document.getElementById('article_modal');
  const closeBtn = document.getElementById('modal_close_btn');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      backdrop.classList.remove('active');
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('active');
    });
  }
}


function filterByCategory(categoryName, el = null) {
  if (el) {
    document.querySelectorAll('.nav-item-link').forEach(a => a.classList.remove('active'));
    el.classList.add('active');
  }
  loadArticles(categoryName);
  const targetSection = document.getElementById('article_container');
  if (targetSection) targetSection.scrollIntoView({ behavior: 'smooth' });
}
