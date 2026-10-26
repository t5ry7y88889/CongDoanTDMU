/**
 * Dịch vụ Quản lý Cấu hình Kênh Truyền Thông (Facebook, Zalo, Website)
 * Công Đoàn Trường Đại Học Thủ Dầu Một
 *
 * Chức năng: Lưu trữ, đọc và kiểm tra tính hợp lệ của Token, PageID, OA ID và Tài khoản.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'data', 'channel_config.json');

const DEFAULT_ACCOUNTS = {
  zalo: [
    {
      id: 'zalo-congdoan-group',
      name: 'Nhóm Zalo Công Đoàn TDMU (Chính thức)',
      type: 'group',
      groupName: 'Công đoàn Trường ĐH Thủ Dầu Một - Kênh Tin Tức & Thông Báo',
      groupLink: 'https://zalo.me/g/wdhpzaoap7wkxb074exv',
      groupId: 'tdmu_congdoan_official',
      recipientPhone: '0386543483',
      isDefault: true
    }
  ],
  facebook: [
    {
      id: 'fb-default',
      name: 'Fanpage Công Đoàn TDMU (Mặc định)',
      pageId: process.env.FACEBOOK_PAGE_ID || '1417956021396650',
      accessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '',
      pageName: process.env.FACEBOOK_PAGE_NAME || 'Công Đoàn Trường Đại học Thủ Dầu Một',
      isDefault: true,
      type: 'page'
    }
  ]
};

function getRawConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveRawConfig(data) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

function getChannelCredentials() {
  const saved = getRawConfig();
  const defaultSettings = {
    facebook: {
      pageId: process.env.FACEBOOK_PAGE_ID || '1417956021396650',
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
      domain: process.env.PUBLIC_DOMAIN || 'http://localhost:3001',
      enabled: true
    }
  };

  return {
    facebook: { ...defaultSettings.facebook, ...(saved.facebook || {}) },
    zalo: { ...defaultSettings.zalo, ...(saved.zalo || {}) },
    web: { ...defaultSettings.web, ...(saved.web || {}) }
  };
}

function saveChannelCredentials(patch) {
  const saved = getRawConfig();
  const creds = getChannelCredentials();
  const updated = {
    ...saved,
    facebook: { ...creds.facebook, ...(patch.facebook || {}) },
    zalo: { ...creds.zalo, ...(patch.zalo || {}) },
    web: { ...creds.web, ...(patch.web || {}) }
  };

  saveRawConfig(updated);
  return getChannelCredentials();
}

function getAccountsForChannel(channelKey) {
  const saved = getRawConfig();
  const pluralKey = channelKey === 'facebook' ? 'facebookAccounts' : 'zaloAccounts';

  if (Array.isArray(saved[pluralKey]) && saved[pluralKey].length > 0) {
    return saved[pluralKey];
  }
  if (Array.isArray(saved[channelKey]?.accounts) && saved[channelKey].accounts.length > 0) {
    return saved[channelKey].accounts;
  }
  return DEFAULT_ACCOUNTS[channelKey] || [];
}

function saveAccountsForChannel(channelKey, accounts) {
  const saved = getRawConfig();
  const pluralKey = channelKey === 'facebook' ? 'facebookAccounts' : 'zaloAccounts';

  saved[pluralKey] = accounts;
  if (!saved[channelKey]) saved[channelKey] = {};
  saved[channelKey].accounts = accounts;

  saveRawConfig(saved);
  return accounts;
}

function getChannelAccounts() {
  return {
    facebook: getAccountsForChannel('facebook'),
    zalo: getAccountsForChannel('zalo')
  };
}

function saveChannelAccount({ channel, account }) {
  const accounts = getAccountsForChannel(channel);
  const idx = accounts.findIndex(a => a.id === account.id);
  if (idx >= 0) {
    accounts[idx] = { ...accounts[idx], ...account };
  } else {
    if (!account.id) account.id = `${channel}-${Date.now()}`;
    accounts.push(account);
  }
  saveAccountsForChannel(channel, accounts);
  return getChannelAccounts();
}

function deleteChannelAccount({ channel, accountId }) {
  let accounts = getAccountsForChannel(channel);
  accounts = accounts.filter(a => a.id !== accountId);
  saveAccountsForChannel(channel, accounts);
  return getChannelAccounts();
}

function getAccountById(channelKey, accountId) {
  const accounts = getAccountsForChannel(channelKey);
  return accounts.find(a => a.id === accountId) || accounts[0] || {};
}

module.exports = {
  getChannelCredentials,
  saveChannelCredentials,
  getAccountsForChannel,
  saveAccountsForChannel,
  getChannelAccounts,
  saveChannelAccount,
  deleteChannelAccount,
  getAccountById,
  DEFAULT_ACCOUNTS
};
