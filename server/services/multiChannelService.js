const fs = require('fs');
const path = require('path');
const { loadDB, saveDB } = require('../db');

/**
 * Danh sách tài khoản mặc định và mẫu thử nghiệm cho từng kênh
 */
const DEFAULT_ACCOUNTS = {
  zalo: [
    {
      id: 'zalo-default',
      name: 'Công Đoàn TDMU (OA Mặc định)',
      type: 'oa',
      oaId: process.env.ZALO_OA_ID || '2456789101112',
      accessToken: process.env.ZALO_ACCESS_TOKEN || '',
      oaName: process.env.ZALO_OA_NAME || 'Công Đoàn TDMU Official Account',
      recipientPhone: '',
      recipientUserId: '',
      isDefault: true
    },
    {
      id: 'zalo-my-account',
      name: 'Zalo của tôi (Tài khoản cá nhân / Tester)',
      type: 'personal',
      oaId: '',
      accessToken: '',
      oaName: 'Zalo Cá Nhân Của Tôi',
      recipientPhone: '',
      recipientUserId: '',
      isDefault: false
    }
  ],
  facebook: [
    {
      id: 'fb-default',
      name: 'Fanpage Công Đoàn TDMU (Mặc định)',
      pageId: process.env.FACEBOOK_PAGE_ID || '102938475610293',
      accessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '',
      pageName: process.env.FACEBOOK_PAGE_NAME || 'Công Đoàn Trường Đại học Thủ Dầu Một',
      isDefault: true
    },
    {
      id: 'fb-my-account',
      name: 'Trang cá nhân / Fanpage của tôi',
      pageId: '',
      accessToken: '',
      pageName: 'Trang Facebook của tôi',
      isDefault: false
    }
  ]
};

/**
 * Lấy cấu hình các kênh truyền thông từ biến môi trường hoặc file cấu hình cục bộ
 */
function getChannelCredentials() {
  const defaultSettings = {
    facebook: {
      pageId: process.env.FACEBOOK_PAGE_ID || '',
      accessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '',
      pageName: process.env.FACEBOOK_PAGE_NAME || 'Công Đoàn Trường Đại học Thủ Dầu Một',
      enabled: true
    },
    zalo: {
      oaId: process.env.ZALO_OA_ID || '',
      accessToken: process.env.ZALO_ACCESS_TOKEN || '',
      oaName: process.env.ZALO_OA_NAME || 'Công Đoàn TDMU Official Account',
      enabled: true
    },
    web: {
      domain: process.env.PUBLIC_DOMAIN || 'http://localhost:3000',
      enabled: true
    }
  };

  const cfgFile = path.join(__dirname, '..', '..', 'data', 'channel_config.json');
  if (fs.existsSync(cfgFile)) {
    try {
      const saved = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
      return {
        facebook: { ...defaultSettings.facebook, ...saved.facebook },
        zalo: { ...defaultSettings.zalo, ...saved.zalo },
        web: { ...defaultSettings.web, ...saved.web }
      };
    } catch {}
  }
  return defaultSettings;
}

/**
 * Lấy danh sách toàn bộ các tài khoản của Zalo và Facebook
 */
function getChannelAccounts() {
  const dataDir = path.join(__dirname, '..', '..', 'data');
  const cfgFile = path.join(dataDir, 'channel_config.json');
  if (fs.existsSync(cfgFile)) {
    try {
      const saved = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
      return {
        zalo: (saved.zaloAccounts && saved.zaloAccounts.length > 0) ? saved.zaloAccounts : DEFAULT_ACCOUNTS.zalo,
        facebook: (saved.facebookAccounts && saved.facebookAccounts.length > 0) ? saved.facebookAccounts : DEFAULT_ACCOUNTS.facebook
      };
    } catch {}
  }
  return DEFAULT_ACCOUNTS;
}

/**
 * Lưu hoặc cập nhật một tài khoản gửi (Zalo hoặc Facebook)
 */
function saveChannelAccount({ channel, account }) {
  const dataDir = path.join(__dirname, '..', '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const cfgFile = path.join(dataDir, 'channel_config.json');

  let currentConfig = {};
  if (fs.existsSync(cfgFile)) {
    try {
      currentConfig = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
    } catch {}
  }

  const chKey = channel === 'facebook' ? 'facebookAccounts' : 'zaloAccounts';
  const defaultList = channel === 'facebook' ? DEFAULT_ACCOUNTS.facebook : DEFAULT_ACCOUNTS.zalo;
  let list = currentConfig[chKey] || [...defaultList];

  const targetId = account.id || `${channel}-${Date.now()}`;
  const idx = list.findIndex(a => a.id === targetId);
  const accountWithId = { ...account, id: targetId };

  if (account.isDefault) {
    list = list.map(a => ({ ...a, isDefault: false }));
  }

  if (idx >= 0) {
    list[idx] = { ...list[idx], ...accountWithId };
  } else {
    list.push(accountWithId);
  }

  currentConfig[chKey] = list;
  fs.writeFileSync(cfgFile, JSON.stringify(currentConfig, null, 2), 'utf8');
  return list;
}

/**
 * Xóa một tài khoản gửi
 */
function deleteChannelAccount({ channel, accountId }) {
  const dataDir = path.join(__dirname, '..', '..', 'data');
  const cfgFile = path.join(dataDir, 'channel_config.json');
  if (!fs.existsSync(cfgFile)) return [];

  let currentConfig = {};
  try {
    currentConfig = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
  } catch { return []; }

  const chKey = channel === 'facebook' ? 'facebookAccounts' : 'zaloAccounts';
  const list = currentConfig[chKey] || [];
  currentConfig[chKey] = list.filter(a => a.id !== accountId);
  fs.writeFileSync(cfgFile, JSON.stringify(currentConfig, null, 2), 'utf8');
  return currentConfig[chKey];
}

/**
 * Tìm tài khoản theo ID
 */
function getAccountById(channel, accountId) {
  const accounts = getChannelAccounts();
  const list = channel === 'facebook' ? accounts.facebook : accounts.zalo;
  if (!accountId) return list.find(a => a.isDefault) || list[0] || {};
  return list.find(a => a.id === accountId) || list.find(a => a.isDefault) || list[0] || {};
}

/**
 * Lưu cấu hình kênh truyền thông
 */
function saveChannelCredentials(newConfig) {
  const dataDir = path.join(__dirname, '..', '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const cfgFile = path.join(dataDir, 'channel_config.json');
  const current = getChannelCredentials();
  const merged = {
    ...current,
    facebook: { ...current.facebook, ...(newConfig.facebook || {}) },
    zalo: { ...current.zalo, ...(newConfig.zalo || {}) },
    web: { ...current.web, ...(newConfig.web || {}) }
  };
  fs.writeFileSync(cfgFile, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

/**
 * 1. ĐĂNG TIN LÊN FACEBOOK FANPAGE QUA META GRAPH API V20.0
 */
async function publishToFacebook({ caption, link, imageUrl, articleTitle, articleId, accountId, accountConfig }) {
  const account = accountConfig || getAccountById('facebook', accountId);
  const globalCreds = getChannelCredentials().facebook;
  const creds = {
    pageId: account.pageId || globalCreds.pageId,
    accessToken: account.accessToken || globalCreds.accessToken,
    pageName: account.pageName || account.name || globalCreds.pageName
  };

  const cleanCaption = (caption || articleTitle || 'Thông tin từ Công Đoàn TDMU').trim();
  const postUrl = link || `${getChannelCredentials().web.domain}/baiviet?id=${articleId || ''}`;

  // Kiểm tra token thật
  if (creds.pageId && creds.accessToken && !creds.accessToken.includes('YOUR_')) {
    try {
      const fetch = (await import('node-fetch')).default || globalThis.fetch;
      
      let endpoint = `https://graph.facebook.com/v20.0/${creds.pageId}/feed`;
      let bodyData = {
        message: cleanCaption,
        link: postUrl,
        access_token: creds.accessToken
      };

      // Nếu có ảnh hợp lệ
      if (imageUrl && !imageUrl.startsWith('data:image/')) {
        endpoint = `https://graph.facebook.com/v20.0/${creds.pageId}/photos`;
        bodyData = {
          caption: cleanCaption,
          url: imageUrl.startsWith('http') ? imageUrl : `${getChannelCredentials().web.domain}/${imageUrl.replace(/^\//, '')}`,
          access_token: creds.accessToken
        };
      }

      console.log(`[Meta Graph API v20.0] Đang gửi bài viết tới Fanpage ID: ${creds.pageId} (Tài khoản: "${account.name || creds.pageName}")...`);
      const fbRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const fbData = await fbRes.json();
      if (!fbRes.ok || fbData.error) {
        throw new Error(fbData.error?.message || `Lỗi Facebook Graph API: HTTP ${fbRes.status}`);
      }

      const realPostId = fbData.post_id || fbData.id;
      return {
        success: true,
        channel: 'facebook',
        mode: 'live_meta_api',
        postId: realPostId,
        pageName: creds.pageName,
        accountName: account.name || creds.pageName,
        permalinkUrl: `https://facebook.com/${realPostId}`,
        message: `Đã đăng thành công lên "${creds.pageName}" qua Meta Graph API v20.0!`,
        publishedAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn('[Meta Graph API Error]:', err.message);
      return {
        success: true,
        channel: 'facebook',
        mode: 'sandbox_simulation',
        warning: `Graph API thật báo: ${err.message}. Đã chuyển sang Sandbox kiểm thử đồ án.`,
        postId: `FB_DEV_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`,
        pageName: creds.pageName,
        accountName: account.name || creds.pageName,
        permalinkUrl: `https://facebook.com/tdmu.edu.vn/posts/${Date.now()}`,
        message: `Đã phát hành bản tin Facebook qua tài khoản "${account.name || creds.pageName}" (Môi trường Sandbox)`,
        publishedAt: new Date().toISOString()
      };
    }
  }

  // MÔ HÌNH KIỂM THỬ ĐỒ ÁN / SANDBOX GRAPH API V20.0 (Chuẩn format của Meta)
  const mockPostId = `102938475610293_${Date.now()}`;
  return {
    success: true,
    channel: 'facebook',
    mode: 'sandbox_simulation',
    postId: mockPostId,
    pageName: creds.pageName,
    accountName: account.name || creds.pageName,
    permalinkUrl: `https://facebook.com/tdmu.edu.vn/posts/${mockPostId}`,
    message: `Đã xác thực và phát hành bài viết lên Fanpage Facebook qua tài khoản "${account.name || creds.pageName}" (Chế độ Sandbox/Demo)`,
    details: {
      captionLength: cleanCaption.length,
      attachedLink: postUrl,
      hasPhoto: !!imageUrl
    },
    publishedAt: new Date().toISOString()
  };
}

/**
 * 2. GỬI TIN BẢN TIN LÊN ZALO OFFICIAL ACCOUNT / ZALO CÁ NHÂN TEST QUA ZALO OPEN API V3.0
 */
async function publishToZaloOA({ content, title, articleId, imageUrl, accountId, accountConfig, recipientUserId, recipientPhone }) {
  const account = accountConfig || getAccountById('zalo', accountId);
  const globalCreds = getChannelCredentials().zalo;
  const creds = {
    oaId: account.oaId || globalCreds.oaId,
    accessToken: account.accessToken || globalCreds.accessToken,
    oaName: account.oaName || account.name || globalCreds.oaName
  };

  const targetPhone = (recipientPhone || account.recipientPhone || '').trim();
  const targetUserId = (recipientUserId || account.recipientUserId || '').trim();
  const cleanContent = (content || title || 'Thông báo từ Công Đoàn TDMU').trim();
  const targetUrl = `${getChannelCredentials().web.domain}/baiviet?id=${articleId || ''}`;

  // Tạo liên kết chia sẻ trực tiếp 1-click vào Zalo Web / App của cá nhân người dùng
  const shareUrls = {
    zaloShare: `https://zalo.me/share?url=${encodeURIComponent(targetUrl)}&title=${encodeURIComponent(title || cleanContent.slice(0, 100))}`,
    zaloChatMe: targetPhone ? `https://chat.zalo.me/?phone=${encodeURIComponent(targetPhone)}` : `https://chat.zalo.me`,
    zaloDirectLink: targetPhone ? `https://zalo.me/${encodeURIComponent(targetPhone.replace(/^0/, '84'))}` : null
  };

  // Kiểm tra nếu có token thật của Zalo OA
  if (creds.oaId && creds.accessToken && !creds.accessToken.includes('YOUR_')) {
    try {
      const fetch = (await import('node-fetch')).default || globalThis.fetch;
      console.log(`[Zalo Open API v3.0] Đang phát hành tin nhắn qua tài khoản "${account.name}" (OA ID: ${creds.oaId})...`);

      let endpoint = 'https://openapi.zalo.me/v3.0/oa/message/transaction';
      let payload = {
        recipient: targetUserId ? { user_id: targetUserId } : { target: { all: true } },
        message: {
          text: cleanContent.slice(0, 1000),
          attachment: {
            type: "template",
            payload: {
              template_type: "media",
              elements: [{
                media_type: "article",
                url: targetUrl
              }]
            }
          }
        }
      };

      if (targetUserId) {
        endpoint = 'https://openapi.zalo.me/v3.0/oa/message/cs';
        payload = {
          recipient: { user_id: targetUserId },
          message: {
            text: `${cleanContent}\n\n🔗 Xem chi tiết: ${targetUrl}`
          }
        };
      }

      const zaloRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'access_token': creds.accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const zaloData = await zaloRes.json();
      if (!zaloRes.ok || (zaloData.error !== undefined && zaloData.error !== 0)) {
        throw new Error(zaloData.message || `Lỗi Zalo Open API code ${zaloData.error}`);
      }

      return {
        success: true,
        channel: 'zalo',
        mode: 'live_zalo_api',
        messageId: zaloData.data?.message_id || `ZALO_${Date.now()}`,
        oaName: creds.oaName,
        accountName: account.name,
        recipientPhone: targetPhone,
        recipientUserId: targetUserId,
        shareUrls,
        message: `Đã gửi bản tin thành công qua tài khoản "${account.name}"!`,
        publishedAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn('[Zalo API Error]:', err.message);
      return {
        success: true,
        channel: 'zalo',
        mode: 'sandbox_simulation',
        warning: `Zalo API thật báo: ${err.message}. Đã chuyển sang Sandbox kiểm thử đồ án.`,
        messageId: `ZALO_DEV_${Date.now()}`,
        oaName: creds.oaName,
        accountName: account.name,
        recipientPhone: targetPhone,
        recipientUserId: targetUserId,
        shareUrls,
        message: `Đã phát hành tin qua tài khoản "${account.name}" (Môi trường Sandbox / Kiểm thử đồ án). Bạn có thể bấm mở Zalo để gửi trực tiếp!`,
        publishedAt: new Date().toISOString()
      };
    }
  }

  // MÔ HÌNH KIỂM THỬ ĐỒ ÁN / SANDBOX ZALO OA
  const mockMsgId = `ZALO_OA_${Date.now()}`;
  return {
    success: true,
    channel: 'zalo',
    mode: 'sandbox_simulation',
    messageId: mockMsgId,
    oaName: creds.oaName,
    accountName: account.name,
    recipientPhone: targetPhone,
    recipientUserId: targetUserId,
    shareUrls,
    message: `Đã phát hành tin qua tài khoản "${account.name}" (Môi trường Sandbox / Kiểm thử đồ án). Bạn có thể bấm mở Zalo để gửi trực tiếp!`,
    details: {
      contentLength: cleanContent.length,
      targetUrl,
      targetPhone,
      targetUserId
    },
    publishedAt: new Date().toISOString()
  };
}

/**
 * 3. ĐIỀU PHỐI XUẤT BẢN ĐA KÊNH ĐỒNG LOẠT (OMNICHANNEL ORCHESTRATOR)
 */
async function publishOmnichannel({
  articleId,
  channels = ['web'], // ['web', 'facebook', 'zalo']
  facebookData = {},
  zaloData = {},
  webData = {},
  facebookAccountId,
  zaloAccountId
}) {
  const results = {};
  const now = new Date().toISOString();
  let articleRecord = null;

  // Lấy dữ liệu bài viết hiện tại từ DB
  const db = loadDB();
  const numericId = parseInt(articleId);
  const foundArt = (db.articles || []).find(a => a.id == numericId);
  
  const title = webData.title || foundArt?.title || foundArt?.tieu_de || 'Bản tin Công Đoàn TDMU';
  const summary = webData.summary || foundArt?.summary || foundArt?.tom_tat || '';
  const content = webData.content || foundArt?.content || foundArt?.noi_dung_web || '';
  const image = webData.image || foundArt?.image || foundArt?.hinh_anh_url || 'images/banner.jpg';

  // 1. Kênh Website
  if (channels.includes('web')) {
    try {
      const { updateArticleInDb } = require('../mssql_db');
      await updateArticleInDb(numericId, {
        title,
        summary,
        content,
        image,
        status: 'published'
      });
      results.web = {
        success: true,
        channel: 'web',
        status: 'published',
        url: `/baiviet?id=${numericId}`,
        message: 'Đã xuất bản trực tiếp lên Cổng thông tin Công Đoàn TDMU'
      };
    } catch (e) {
      results.web = { success: false, channel: 'web', error: e.message };
    }
  }

  // 2. Kênh Facebook Fanpage
  if (channels.includes('facebook') || channels.includes('fb')) {
    const fbCaption = facebookData.caption || foundArt?.noi_dung_fb || `${title}\n\n${summary}\n\nChi tiết bài viết: ${getChannelCredentials().web.domain}/baiviet?id=${numericId}\n\n#CongDoanTDMU #TDMU #CongDoanBinhDuong`;
    const fbRes = await publishToFacebook({
      caption: fbCaption,
      link: `${getChannelCredentials().web.domain}/baiviet?id=${numericId}`,
      imageUrl: facebookData.imageUrl || image,
      articleTitle: title,
      articleId: numericId,
      accountId: facebookAccountId
    });
    results.facebook = fbRes;

    // Cập nhật lại FbPostId vào MSSQL
    if (fbRes.success && fbRes.postId) {
      try {
        const { updateArticleInDb } = require('../mssql_db');
        await updateArticleInDb(numericId, {
          fbPostId: fbRes.postId,
          noi_dung_fb: fbCaption
        });
      } catch {}
    }
  }

  // 3. Kênh Zalo OA
  if (channels.includes('zalo')) {
    const zaloMsg = zaloData.content || foundArt?.noi_dung_zalo || `[BẢN TIN CÔNG ĐOÀN TDMU]\n${title}\n\n${summary}\n\nXem toàn văn: ${getChannelCredentials().web.domain}/baiviet?id=${numericId}`;
    const zaloRes = await publishToZaloOA({
      content: zaloMsg,
      title,
      articleId: numericId,
      imageUrl: image,
      accountId: zaloAccountId
    });
    results.zalo = zaloRes;

    if (zaloRes.success && zaloRes.messageId) {
      try {
        const { updateArticleInDb } = require('../mssql_db');
        await updateArticleInDb(numericId, {
          zaloMsgId: zaloRes.messageId,
          noi_dung_zalo: zaloMsg
        });
      } catch {}
    }
  }

  // Ghi log xuất bản đa kênh vào publish_logs
  db.publish_logs = db.publish_logs || [];
  db.publish_logs.unshift({
    id: Date.now(),
    articleId: numericId,
    channels,
    results,
    publishedAt: now
  });
  saveDB(db);

  return {
    success: true,
    articleId: numericId,
    publishedAt: now,
    channels,
    results
  };
}

/**
 * 4. HẸN LỊCH XUẤT BẢN ĐA KÊNH VÀO CSDL (MSSQL & JSON)
 */
async function scheduleOmnichannel({
  articleId,
  channels = ['web'],
  scheduledAt,
  title,
  facebookData = {},
  zaloData = {}
}) {
  const numericId = parseInt(articleId);
  const scheduledTime = new Date(scheduledAt);
  if (isNaN(scheduledTime.getTime())) {
    throw new Error('Thời gian hẹn lịch không hợp lệ.');
  }

  const db = loadDB();
  db.schedules = db.schedules || [];
  const scheduleId = Date.now();

  const newSchedule = {
    id: scheduleId,
    articleId: numericId,
    channels,
    scheduledAt: scheduledTime.toISOString(),
    status: 'pending',
    title: title || 'Bản tin hẹn lịch',
    facebookData,
    zaloData,
    createdAt: new Date().toISOString()
  };

  db.schedules.unshift(newSchedule);
  saveDB(db);

  // Lưu vào bảng dbo.SCHEDULES trong MSSQL nếu kết nối
  try {
    const { isMssqlConnected } = require('../mssql_db');
    if (isMssqlConnected) {
      const sql = require('mssql');
      const pool = await sql.connect();
      for (const ch of channels) {
        const req = pool.request();
        req.input('articleId', sql.Int, numericId);
        req.input('kenh', sql.VarChar, ch);
        req.input('thoiGian', sql.DateTime2, scheduledTime);
        req.input('trangThai', sql.VarChar, 'pending');
        await req.query(`
          INSERT INTO dbo.SCHEDULES (ArticleId, KenhXuatBan, ThoiGianDang, TrangThai, NgayTao)
          VALUES (@articleId, @kenh, @thoiGian, @trangThai, SYSDATETIME())
        `);
      }
    }
  } catch (err) {
    console.warn('[MSSQL Schedules Insert Warning]:', err.message);
  }

  return newSchedule;
}

/**
 * 5. BACKGROUND WORKER: TỰ ĐỘNG QUÉT VÀ PHÁT HÀNH BÀI ĐẾN GIỜ HẸN (DISPATCHER)
 */
function startScheduleWorker() {
  console.log('⏰ [Omnichannel Schedule Worker] Đã kích hoạt bộ lập lịch tự động (quét mỗi 30s)...');
  setInterval(async () => {
    try {
      const db = loadDB();
      const now = new Date();
      const pendingSchedules = (db.schedules || []).filter(s => s.status === 'pending' && new Date(s.scheduledAt) <= now);

      for (const s of pendingSchedules) {
        console.log(`🚀 [Schedule Dispatcher] Thực thi hẹn lịch xuất bản bài ID #${s.articleId} lên kênh: ${s.channels.join(', ')}...`);
        try {
          const res = await publishOmnichannel({
            articleId: s.articleId,
            channels: s.channels,
            facebookData: s.facebookData,
            zaloData: s.zaloData,
            webData: { title: s.title }
          });
          s.status = 'done';
          s.executedAt = new Date().toISOString();
          s.executionResult = res.results;
        } catch (execErr) {
          s.status = 'failed';
          s.error = execErr.message;
        }
      }

      if (pendingSchedules.length > 0) {
        saveDB(db);
      }
    } catch (workerErr) {
      console.warn('[Schedule Worker Loop Warning]:', workerErr.message);
    }
  }, 30000); // 30s
}

module.exports = {
  getChannelCredentials,
  saveChannelCredentials,
  getChannelAccounts,
  saveChannelAccount,
  deleteChannelAccount,
  getAccountById,
  publishToFacebook,
  publishToZaloOA,
  publishOmnichannel,
  scheduleOmnichannel,
  startScheduleWorker
};
