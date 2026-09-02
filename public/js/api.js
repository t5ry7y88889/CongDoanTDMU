// Centralized REST API Service for TDMU Trade Union Web System
const API = {
  // Articles
  async getArticles(category = 'all', status = 'all', search = '') {
    const res = await fetch(`/api/articles?category=${encodeURIComponent(category)}&status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`);
    return await res.json();
  },

  async getArticleById(id) {
    const res = await fetch(`/api/articles/${id}`);
    return await res.json();
  },

  async createArticle(data) {
    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async updateArticle(id, data) {
    const res = await fetch(`/api/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async deleteArticle(id) {
    const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
    return await res.json();
  },

  async approveArticle(id) {
    const res = await fetch(`/api/articles/${id}/approve`, { method: 'POST' });
    return await res.json();
  },

  async likeArticle(id) {
    const res = await fetch(`/api/articles/${id}/like`, { method: 'POST' });
    return await res.json();
  },

  async addComment(id, authorName, commentText) {
    const res = await fetch(`/api/articles/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorName, commentText })
    });
    return await res.json();
  },

  async deleteComment(id) {
    const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    return await res.json();
  },

  // User & Account Management REST API
  async getUsers() {
    const res = await fetch('/api/users');
    return await res.json();
  },

  async createUser(data) {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async deleteUser(id) {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    return await res.json();
  },

  // Events REST API
  async getEvents() {
    const res = await fetch('/api/events');
    return await res.json();
  },

  async createEvent(data) {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async deleteEvent(id) {
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    return await res.json();
  },

  // Media Studio REST API
  async getMedia() {
    const res = await fetch('/api/media');
    return await res.json();
  },

  async uploadMedia(data) {
    const res = await fetch('/api/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async deleteMedia(id) {
    const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
    return await res.json();
  },

  // Analytics & Audit Logs
  async getAnalytics() {
    const res = await fetch('/api/analytics');
    return await res.json();
  },

  async getAudits() {
    const res = await fetch('/api/audits');
    return await res.json();
  },

  // AI Content Generator
  async generateAI(data) {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async floatingCommand(data) {
    const res = await fetch('/api/ai/floating-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async repurposeContent(data) {
    const res = await fetch('/api/ai/repurpose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // Facebook Fanpage API
  async publishFacebook(data) {
    const res = await fetch('/api/facebook/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // Documents API
  async getDocuments() {
    const res = await fetch('/api/documents');
    return await res.json();
  },

  async createDocument(data) {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async deleteDocument(id) {
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    return await res.json();
  },

  // Monthly Reports API (16 Tổ Công Đoàn)
  async getMonthlyReports() {
    const res = await fetch('/api/monthly-reports');
    return await res.json();
  },

  async submitMonthlyReport(data) {
    const res = await fetch('/api/monthly-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // Schedules API
  async getSchedules() {
    const res = await fetch('/api/schedules');
    return await res.json();
  }
};

window.API = API;
