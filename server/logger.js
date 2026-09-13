const fs = require('fs');
const path = require('path');
const pino = require('pino');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const isDev = (process.env.NODE_ENV || 'development') !== 'production';
const isTest = process.env.NODE_ENV === 'test';

const logger = pino({
  level: isTest ? 'silent' : (process.env.LOG_LEVEL || 'info'),
  redact: ['req.headers.authorization', 'password', '*.password', 'PasswordHash'],
  transport: isDev
    ? {
        targets: [
          { target: 'pino/file', options: { destination: path.join(logDir, 'server.log') } },
          { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
        ]
      }
    : undefined
});

module.exports = logger;