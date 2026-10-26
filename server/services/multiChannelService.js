/**
 * Multi-Channel Publishing Facade Service
 * Công Đoàn Trường Đại Học Thủ Dầu Một
 *
 * File này hoạt động như một Facade kết nối các Service chuyên biệt:
 *  - dichVuFacebook.service.js: Quản lý Graph API Fanpage & Album ảnh
 *  - dichVuZalo.service.js: Quản lý Zalo OA & Zalo Bot tự động
 *  - dichVuCauHinhKenh.service.js: Quản lý Token & Tài khoản cấu hình
 *  - dichVuDaKenh.service.js: Điều phối phát hành đa kênh & Lập lịch
 */

const {
  getChannelCredentials,
  saveChannelCredentials,
  getAccountsForChannel,
  saveAccountsForChannel,
  getChannelAccounts,
  saveChannelAccount,
  deleteChannelAccount,
  getAccountById,
  DEFAULT_ACCOUNTS
} = require('./dichVuCauHinhKenh.service');

const {
  publishToFacebook,
  testFacebookConnection,
  resolveFacebookPageAccessToken
} = require('./dichVuFacebook.service');

const {
  publishToZaloOA,
  testZaloConnection
} = require('./dichVuZalo.service');

const {
  publishMultiChannel,
  createScheduledPost,
  getScheduledPosts,
  cancelScheduledPost,
  executeScheduledPosts,
  startScheduleWorker
} = require('./dichVuDaKenh.service');

async function testChannelConnection(channel, credentials) {
  if (channel === 'facebook') return testFacebookConnection(credentials);
  if (channel === 'zalo') return testZaloConnection(credentials);
  return { success: false, message: `Kênh không xác định: ${channel}` };
}

module.exports = {
  // Cấu hình kênh & Tài khoản
  getChannelCredentials,
  saveChannelCredentials,
  getAccountsForChannel,
  saveAccountsForChannel,
  getChannelAccounts,
  saveChannelAccount,
  deleteChannelAccount,
  getAccountById,
  DEFAULT_ACCOUNTS,
  testChannelConnection,

  // Facebook
  publishToFacebook,
  testFacebookConnection,
  resolveFacebookPageAccessToken,

  // Zalo
  publishToZaloOA,
  testZaloConnection,

  // Đa kênh & Lập lịch
  publishMultiChannel,
  createScheduledPost,
  getScheduledPosts,
  cancelScheduledPost,
  executeScheduledPosts,
  startScheduleWorker
};
