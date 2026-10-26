/**
 * Channel Controller - Xử lý API Phát hành Đa Kênh (Facebook, Zalo, Lập Lịch)
 * Công Đoàn Trường Đại Học Thủ Dầu Một
 */

const {
  getChannelCredentials,
  saveChannelCredentials,
  getChannelAccounts,
  saveChannelAccount,
  deleteChannelAccount,
  getAccountById,
  resolveFacebookPageAccessToken,
  testChannelConnection,
  publishToFacebook,
  publishToZaloOA,
  publishMultiChannel,
  createScheduledPost,
  getScheduledPosts,
  cancelScheduledPost
} = require('../services/multiChannelService');

const dichVuZaloBot = require('../services/dichVuZaloBot.service');

// 1. Cấu hình & Tài khoản
function getChannelSettings(req, res) {
  const creds = getChannelCredentials();
  res.json({
    success: true,
    data: {
      facebook: {
        pageId: creds.facebook.pageId,
        pageName: creds.facebook.pageName,
        hasToken: Boolean(creds.facebook.accessToken),
        enabled: creds.facebook.enabled
      },
      zalo: {
        oaId: creds.zalo.oaId,
        oaName: creds.zalo.oaName,
        hasToken: Boolean(creds.zalo.accessToken),
        enabled: creds.zalo.enabled
      },
      web: creds.web
    }
  });
}

function updateChannelSettings(req, res) {
  const updated = saveChannelCredentials(req.body);
  res.json({ success: true, message: 'Đã cập nhật cấu hình API đa kênh thành công', data: updated });
}

function getAccounts(req, res) {
  const accounts = getChannelAccounts();
  res.json({ success: true, data: accounts });
}

async function saveAccount(req, res) {
  try {
    const { channel, account } = req.body;
    if (!channel || !account) {
      return res.status(400).json({ success: false, error: 'Thiếu channel hoặc thông tin account' });
    }
    let accToSave = { ...account };
    if (channel === 'facebook' && accToSave.pageId && accToSave.accessToken) {
      try {
        const resolved = await resolveFacebookPageAccessToken(accToSave.pageId, accToSave.accessToken);
        if (resolved?.accessToken) {
          accToSave.userToken = accToSave.accessToken;
          accToSave.accessToken = resolved.accessToken;
          if (resolved.pageName) accToSave.pageName = resolved.pageName;
        }
      } catch {}
    }
    const updatedList = saveChannelAccount({ channel, account: accToSave });
    res.json({ success: true, message: `Đã lưu tài khoản "${accToSave.name || 'Mới'}" thành công!`, data: updatedList });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

function deleteAccount(req, res) {
  try {
    const { channel, id } = req.params;
    const updatedList = deleteChannelAccount({ channel, accountId: id });
    res.json({ success: true, message: 'Đã xóa tài khoản thành công', data: updatedList });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function testConnection(req, res) {
  const channel = req.body?.channel || req.query?.channel;
  const accountId = req.body?.accountId || req.query?.accountId;
  const credentials = req.body?.credentials;
  const result = await testChannelConnection(channel, credentials || getAccountById(channel, accountId));
  res.json(result);
}

// 2. Xuất bản trực tiếp Facebook & Zalo
async function publishFacebookDirect(req, res) {
  try {
    const result = await publishToFacebook(req.body);
    res.json({
      success: true,
      message: result.message || 'Đã đăng bài lên Fanpage Facebook thành công!',
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function publishZaloDirect(req, res) {
  try {
    const result = await publishToZaloOA(req.body);
    res.json({
      success: true,
      message: result.message || 'Đã gửi bản tin qua Zalo thành công!',
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function publishZaloGroup(req, res) {
  try {
    const result = await dichVuZaloBot.sendToGroup(req.body);
    res.json({ success: true, message: result.message, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 3. Xuất bản đồng thời đa kênh (Omnichannel)
async function publishOmnichannelNow(req, res) {
  try {
    const { articleId, channels, facebook, zalo, web, scheduledAt } = req.body;
    const result = await publishMultiChannel({
      channels: channels || ['web'],
      articleId,
      title: web?.title,
      sapo: web?.summary,
      content: web?.content,
      fbCaption: facebook?.caption,
      fbPhotos: facebook?.photos || (facebook?.imageUrl ? [facebook.imageUrl] : []),
      zaloText: zalo?.content,
      zaloPhoto: zalo?.imageUrl,
      scheduledAt
    });
    res.json({ success: true, message: 'Phát hành đa kênh hoàn tất', data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// 4. Lập lịch hẹn giờ
function getSchedules(req, res) {
  const list = getScheduledPosts();
  res.json({ success: true, data: list });
}

function createSchedule(req, res) {
  try {
    const item = createScheduledPost(req.body);
    res.json({ success: true, message: 'Đã lên lịch thành công', data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

function cancelSchedule(req, res) {
  const ok = cancelScheduledPost(req.params.id);
  if (!ok) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn' });
  res.json({ success: true, message: 'Đã hủy lịch hẹn thành công' });
}

module.exports = {
  getChannelSettings,
  updateChannelSettings,
  getAccounts,
  saveAccount,
  deleteAccount,
  testConnection,
  publishFacebookDirect,
  publishZaloDirect,
  publishZaloGroup,
  publishOmnichannelNow,
  getSchedules,
  createSchedule,
  cancelSchedule
};
