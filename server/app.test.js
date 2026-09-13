import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('./app');

const DB_FILE = path.join(__dirname, 'database.json');
const DB_SNAPSHOT = path.join(__dirname, '..', '.database.test.backup');

beforeAll(() => {
  fs.copyFileSync(DB_FILE, DB_SNAPSHOT);
});

afterAll(() => {
  if (fs.existsSync(DB_SNAPSHOT)) {
    fs.copyFileSync(DB_SNAPSHOT, DB_FILE);
    fs.unlinkSync(DB_SNAPSHOT);
  }
});

const get = (route) => request(app).get(route);

describe('Articles API', () => {
  it('returns published articles', async () => {
    const res = await get('/api/articles?status=published');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toHaveProperty('title');
    expect(res.body.data[0]).toHaveProperty('status');
  });

  it('returns a single article by id', async () => {
    const list = await get('/api/articles');
    const first = list.body.data[0];
    const res = await get(`/api/articles/${first.id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toEqual(first.id);
  });

  it('returns 404 for a missing article', async () => {
    const res = await get('/api/articles/99999999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('Documents API', () => {
  it('returns documents with English keys', async () => {
    const res = await get('/api/documents');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const doc = res.body.data[0];
    expect(doc).toHaveProperty('reference_number');
    expect(doc).toHaveProperty('title');
    expect(doc).toHaveProperty('category');
    expect(doc).toHaveProperty('file_url');
  });

  it('filters documents by category', async () => {
    const res = await get('/api/documents?category=kehoach');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const d of res.body.data) {
      expect(d.category).toBe('kehoach');
    }
  });
});

describe('Organization API', () => {
  it('returns the org full tree', async () => {
    const res = await get('/api/org-full-tree');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.boards)).toBe(true);
    expect(Array.isArray(res.body.data.units)).toBe(true);
    expect(res.body.data.units.length).toBeGreaterThanOrEqual(1);
  });

  it('returns trade unions alias', async () => {
    const res = await get('/api/trade-unions');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('returns categories', async () => {
    const res = await get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });
});

describe('Welfare API', () => {
  it('returns welfare programs', async () => {
    const res = await get('/api/welfare');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty('code');
    expect(res.body.data[0]).toHaveProperty('title');
  });

  it('accepts an assistance application', async () => {
    const res = await request(app)
      .post('/api/welfare/apply')
      .send({ full_name: 'Test Đoàn Viên', type: 'tro_cap', reason: 'Kiểm thử tự động' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });

  it('rejects an application missing required fields', async () => {
    const res = await request(app).post('/api/welfare/apply').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Monthly Reports API', () => {
  it('returns monthly reports', async () => {
    const res = await get('/api/monthly-reports');
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty('union_id');
    expect(res.body.data[0]).toHaveProperty('month');
  });
});

describe('Feedback API', () => {
  it('rejects feedback missing required fields', async () => {
    const res = await request(app).post('/api/feedback').send({ title: 'Thiếu họ tên' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('accepts valid feedback', async () => {
    const res = await request(app).post('/api/feedback').send({
      sender_name: 'Đoàn Viên Kiểm Thử',
      title: 'Góp ý kiểm thử',
      content: 'Nội dung góp ý tự động từ bộ kiểm thử.'
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });
});

describe('API 404 handling', () => {
  it('returns JSON 404 for unknown API endpoints', async () => {
    const res = await get('/api/khong-ton-tai');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});