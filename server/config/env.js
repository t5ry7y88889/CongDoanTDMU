/**
 * Nạp và kiểm tra các biến môi trường cấu hình hệ thống
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'production',
  
  // Microsoft SQL Server
  DB_SERVER: process.env.DB_SERVER || 'RTX-ON\\MSSQLVESE',
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: parseInt(process.env.DB_PORT || '56205'),
  DB_DATABASE: process.env.DB_DATABASE || 'TDMU_TradeUnion_DB',
  DB_USER: process.env.DB_USER || 'node_app',
  DB_PASSWORD: process.env.DB_PASSWORD || 'TDMUNode@2026',

  // Trí tuệ nhân tạo (AI Models)
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // Kênh truyền thông (Facebook & Zalo)
  FB_PAGE_ID: process.env.FB_PAGE_ID || '',
  FB_ACCESS_TOKEN: process.env.FB_ACCESS_TOKEN || '',
  ZALO_OA_ID: process.env.ZALO_OA_ID || '',
  ZALO_ACCESS_TOKEN: process.env.ZALO_ACCESS_TOKEN || ''
};
