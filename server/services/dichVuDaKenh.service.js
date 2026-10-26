/**
 * Dịch vụ Điều Phối Đa Kênh & Lập Lịch Tự Động (Omnichannel Orchestrator)
 * Công Đoàn Trường Đại Học Thủ Dầu Một
 *
 * Chức năng:
 *  - Xuất bản đồng thời Web + Facebook + Zalo
 *  - Hàng đợi bài viết hẹn giờ (Scheduled Queue)
 *  - Worker tự động quét bài đến hạn mỗi 30 giây
 */

const { publishToFacebook } = require('./dichVuFacebook.service');
const { publishToZaloOA } = require('./dichVuZalo.service');
const { getChannelCredentials } = require('./dichVuCauHinhKenh.service');
const { loadDB, saveDB } = require('../db');

/**
 * Phát hành đồng thời bài viết lên các kênh được chọn
 */
async function publishMultiChannel({ channels = ['web'], articleId, title, sapo, content, fbCaption, fbPhotos, zaloText, zaloPhoto, scheduledAt }) {
  // Nếu có hẹn giờ trong tương lai
  if (scheduledAt && new Date(scheduledAt) > new Date()) {
    const post = createScheduledPost({
      channels,
      articleId,
      title,
      content,
      scheduledAt,
      fbData: { caption: fbCaption, photos: fbPhotos },
      zaloData: { text: zaloText, photo: zaloPhoto }
    });
    return {
      scheduled: true,
      message: `Đã lên lịch xuất bản lúc ${new Date(scheduledAt).toLocaleString('vi-VN')}`,
      scheduledPost: post
    };
  }

  const results = {};

  // Kênh 1: Website nội bộ (Cập nhật trực tiếp CSDL MSSQL & database.json sang 'published')
  if (channels.includes('web') || !channels.length) {
    if (articleId) {
      try {
        const { updateArticleInDb } = require('../mssql_db');
        await updateArticleInDb(articleId, {
          title,
          summary: sapo,
          content,
          status: 'published',
          publishedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('[publishMultiChannel] Lỗi cập nhật bài viết sang CSDL MSSQL:', err.message);
      }
    }
    results.web = {
      success: true,
      channel: 'web',
      articleId,
      articleUrl: `${getChannelCredentials().web.domain}/baiviet?id=${articleId || ''}`,
      publishedAt: new Date().toISOString()
    };
  }

  // Kênh 2: Facebook Fanpage
  if (channels.includes('facebook') || channels.includes('fb')) {
    try {
      results.facebook = await publishToFacebook({
        caption: fbCaption || sapo || title,
        articleTitle: title,
        articleId,
        imageUrls: Array.isArray(fbPhotos) ? fbPhotos : []
      });
      if (results.facebook && results.facebook.success && articleId) {
        try {
          const { updateArticleInDb } = require('../mssql_db');
          await updateArticleInDb(articleId, {
            fbPostId: results.facebook.postId || results.facebook.id,
            noi_dung_fb: fbCaption
          });
        } catch (e) {}
      }
    } catch (err) {
      results.facebook = { success: false, channel: 'facebook', error: err.message };
    }
  }

  // Kênh 3: Zalo OA / Zalo Bot
  if (channels.includes('zalo')) {
    try {
      results.zalo = await publishToZaloOA({
        title,
        content: zaloText || sapo || title,
        articleId,
        imageUrl: zaloPhoto || (Array.isArray(fbPhotos) ? fbPhotos[0] : null)
      });
      if (results.zalo && results.zalo.success && articleId) {
        try {
          const { updateArticleInDb } = require('../mssql_db');
          await updateArticleInDb(articleId, {
            zaloMsgId: results.zalo.msgId || results.zalo.message_id,
            noi_dung_zalo: zaloText
          });
        } catch (e) {}
      }
    } catch (err) {
      results.zalo = { success: false, channel: 'zalo', error: err.message };
    }
  }

  return {
    success: Object.values(results).some(r => r.success),
    results,
    publishedAt: new Date().toISOString()
  };
}

/**
 * Tạo bài đăng hẹn giờ
 */
function createScheduledPost(data) {
  const db = loadDB();
  if (!db.scheduledPosts) db.scheduledPosts = [];

  const newPost = {
    id: `sched_${Date.now()}`,
    ...data,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.scheduledPosts.push(newPost);
  saveDB(db);
  return newPost;
}

/**
 * Lấy danh sách bài đăng hẹn giờ
 */
function getScheduledPosts() {
  const db = loadDB();
  return db.scheduledPosts || [];
}

/**
 * Hủy một bài đăng hẹn giờ
 */
function cancelScheduledPost(id) {
  const db = loadDB();
  if (!db.scheduledPosts) return false;
  const idx = db.scheduledPosts.findIndex(p => p.id === id);
  if (idx !== -1) {
    db.scheduledPosts[idx].status = 'cancelled';
    saveDB(db);
    return true;
  }
  return false;
}

/**
 * Worker quét và thực thi các bài hẹn giờ đã đến hạn
 */
async function executeScheduledPosts() {
  const db = loadDB();
  if (!db.scheduledPosts || db.scheduledPosts.length === 0) return;

  const now = new Date();
  for (const post of db.scheduledPosts) {
    if (post.status === 'pending' && new Date(post.scheduledAt) <= now) {
      try {
        post.status = 'processing';
        saveDB(db);

        const result = await publishMultiChannel({
          channels: post.channels,
          articleId: post.articleId,
          title: post.title,
          content: post.content,
          fbCaption: post.fbData?.caption,
          fbPhotos: post.fbData?.photos,
          zaloText: post.zaloData?.text,
          zaloPhoto: post.zaloData?.photo
        });

        post.status = result.success ? 'published' : 'failed';
        post.result = result;
        post.executedAt = new Date().toISOString();
      } catch (err) {
        post.status = 'failed';
        post.error = err.message;
      }
      saveDB(db);
    }
  }
}

/**
 * Worker quét và thực thi các bài hẹn giờ đã đến hạn (quét mỗi 30 giây)
 */
function startScheduleWorker() {
  console.log('⏰ [Omnichannel Schedule Worker] Đã kích hoạt bộ lập lịch tự động (quét mỗi 30s)...');
  setInterval(async () => {
    try {
      await executeScheduledPosts();
    } catch (err) {
      console.error('[Schedule Worker Error]:', err.message);
    }
  }, 30000);
}

module.exports = {
  publishMultiChannel,
  createScheduledPost,
  getScheduledPosts,
  cancelScheduledPost,
  executeScheduledPosts,
  startScheduleWorker
};
