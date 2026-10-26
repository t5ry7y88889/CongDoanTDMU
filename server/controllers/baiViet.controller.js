/**
 * Article Controller - Quản lý Nghiệp Vụ Bài Báo & Bản Thảo
 * Công Đoàn Trường Đại Học Thủ Dầu Một
 * Kiến trúc: MVC (Model - View - Controller)
 */

const { loadDB, saveDB } = require('../db');
const {
  getArticlesFromDb,
  insertArticleToDb,
  updateArticleInDb,
  deleteArticleFromDb,
  incrementArticleReactionInDb
} = require('../mssql_db');

/**
 * Lấy danh sách bài viết (Hỗ trợ lọc theo chuyên mục, trạng thái và tìm kiếm)
 */
async function getAllArticles(req, res) {
  try {
    const { category, status, search } = req.query;
    let list = await getArticlesFromDb(category, status, search);
    list.sort((a, b) => {
      const timeA = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.publishedAt || b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (parseInt(b.id) || 0) - (parseInt(a.id) || 0);
    });

    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Lấy danh sách bản thảo bài viết cho Drawer bên trái
 */
async function getDrafts(req, res) {
  try {
    const list = await getArticlesFromDb('all', 'draft');
    list.sort((a, b) => (new Date(b.createdAt || b.updatedAt || 0)) - (new Date(a.createdAt || a.updatedAt || 0)));
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Lấy chi tiết một bài viết theo ID
 */
async function getArticleById(req, res) {
  try {
    const list = await getArticlesFromDb('all', 'all');
    const item = list.find(a => String(a.id) === String(req.params.id));
    if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Tạo mới một bài viết hoặc lưu bản thảo
 */
async function createArticle(req, res) {
  try {
    const rawData = req.body;
    const isDraft = rawData.isDraft || rawData.status === 'draft';
    const cleanTitle = (rawData.title || (isDraft ? 'Bản thảo chưa đặt tên' : 'Tin tức Công đoàn')).trim();

    // Xử lý categoryId hợp lệ (1: Hoạt động & Phong trào, 2: Chăm lo & Phúc lợi, 3: Thi đua & Tuyên giáo)
    let catId = parseInt(rawData.categoryId);
    if (!catId || isNaN(catId) || catId < 1 || catId > 3) {
      const catStr = String(rawData.category || '').toLowerCase();
      if (catStr.includes('chăm lo') || catStr.includes('phúc lợi') || catStr.includes('cham-lo')) catId = 2;
      else if (catStr.includes('thi đua') || catStr.includes('tuyên giáo') || catStr.includes('thi-dua')) catId = 3;
      else catId = 1;
    }

    const newArticle = {
      title: cleanTitle.slice(0, 250),
      summary: (rawData.summary || rawData.sapo || cleanTitle).trim(),
      content: rawData.content || rawData.noi_dung || cleanTitle,
      image: rawData.image || rawData.featuredImage || 'images/banner.jpg',
      categoryId: catId,
      authorId: parseInt(rawData.authorId) || 1,
      author: rawData.author || 'Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một',
      status: isDraft ? 'draft' : (rawData.status || 'published'),
      isAiGenerated: Boolean(rawData.isAiGenerated),
      aiPrompt: rawData.aiPrompt || null,
      publishedAt: isDraft ? null : (rawData.publishedAt || new Date().toISOString())
    };

    const saved = await insertArticleToDb(newArticle);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Cập nhật nội dung bài viết
 */
async function updateArticle(req, res) {
  try {
    const updated = await updateArticleInDb(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết để cập nhật' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Xóa một bài viết
 */
async function deleteArticle(req, res) {
  try {
    const ok = await deleteArticleFromDb(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết để xóa' });
    res.json({ success: true, message: 'Đã xóa bài viết thành công' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Thả cảm xúc / Tương tác bài viết
 */
async function reactArticle(req, res) {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const updated = await incrementArticleReactionInDb(id, type);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllArticles,
  getDrafts,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  reactArticle
};
