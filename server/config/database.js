/**
 * Cấu hình kết nối Cơ sở dữ liệu Hệ thống
 * Tích hợp chế độ kép: Microsoft SQL Server chính & JSON Live Fallback
 */

const mssql = require('../mssql_db');
const jsonDb = require('../db');

module.exports = {
  mssql,
  jsonDb,
  isMssqlConnected: mssql.isMssqlConnected
};
