async function req(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    const msg = data && (data.error || data.message) ? (data.error || data.message) : `HTTP ${res.status}`
    throw new Error(msg)
  }
  return data
}

const unwrap = (res) => (res && res.data !== undefined ? res.data : res)

export const api = {
  get: (url) => req(url),
  post: (url, body) => req(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body) => req(url, { method: 'PUT', body: JSON.stringify(body) }),
  del: (url) => req(url, { method: 'DELETE' }),

  stats: () => req('/api/dashboard'),

  categories: () => req('/api/categories').then(unwrap),

  articles: (params = '') => req(`/api/articles${params}`).then(unwrap),
  article: (id) => req(`/api/articles/${id}`).then(unwrap),
  createArticle: (body) => req('/api/articles', { method: 'POST', body: JSON.stringify(body) }),
  updateArticle: (id, body) => req(`/api/articles/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteArticle: (id) => req(`/api/articles/${id}`, { method: 'DELETE' }),
  approveArticle: (id) => req(`/api/articles/${id}/approve`, { method: 'POST' }),
  rejectArticle: (id) => req(`/api/articles/${id}/reject`, { method: 'POST' }),

  documents: (params = '') => req(`/api/documents${params}`).then(unwrap),
  createDocument: (body) => req('/api/documents', { method: 'POST', body: JSON.stringify(body) }),
  updateDocument: (id, body) => req(`/api/documents/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDocument: (id) => req(`/api/documents/${id}`, { method: 'DELETE' }),
  parseDocx: (body) => req('/api/documents/parse-docx', { method: 'POST', body: JSON.stringify(body) }),

  orgData: () => req('/api/org-full-tree').then(unwrap),
  toChuc: () => req('/api/to-chuc').then(unwrap),
  unionGroups: () => req('/api/trade-unions').then(unwrap),
  staff: () => req('/api/nhan-su').then(unwrap),
  users: () => req('/api/users').then(unwrap),
  createUser: (body) => req('/api/users', { method: 'POST', body: JSON.stringify(body) }),
  deleteUser: (id) => req(`/api/users/${id}`, { method: 'DELETE' }),

  welfare: () => req('/api/welfare').then(unwrap),
  welfareBenefits: () => req('/api/welfare/phuc-loi').then(unwrap),
  welfareApplications: () => req('/api/welfare/applications').then(unwrap),
  updateWelfareApplication: (id, body) => req(`/api/welfare/applications/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteWelfareApplication: (id) => req(`/api/welfare/applications/${id}`, { method: 'DELETE' }),

  reports: () => req('/api/monthly-reports').then(unwrap),
  reportSummary: () => req('/api/monthly-reports/summary'),
  submitReport: (body) => req('/api/monthly-reports', { method: 'POST', body: JSON.stringify(body) }),

  templates: () => req('/api/templates').then(unwrap),
  template: (id) => req(`/api/templates/${id}`).then(unwrap),
  createTemplate: (body) => req('/api/templates', { method: 'POST', body: JSON.stringify(body) }),
  deleteTemplate: (id) => req(`/api/templates/${id}`, { method: 'DELETE' }),

  feedback: () => req('/api/feedback').then(unwrap),
  feedbackItem: (id) => req(`/api/feedback/${id}`).then(unwrap),
  updateFeedback: (id, body) => req(`/api/feedback/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteFeedback: (id) => req(`/api/feedback/${id}`, { method: 'DELETE' }),

  comments: () => req('/api/inbox/comments').then(unwrap),
  deleteComment: (id) => req(`/api/comments/${id}`, { method: 'DELETE' }),
  audits: () => req('/api/audits'),
  schedules: () => req('/api/publish/schedules').then(unwrap),

  aiGenerate: (body) => req('/api/ai/generate', { method: 'POST', body: JSON.stringify(body) }),
  aiRepurpose: (body) => req('/api/ai/repurpose', { method: 'POST', body: JSON.stringify(body) }),
  aiQualityCheck: (body) => req('/api/ai/quality-check', { method: 'POST', body: JSON.stringify(body) }),
  aiChat: (body) => req('/api/ai/chat', { method: 'POST', body: JSON.stringify(body) })
}

export function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('vi-VN')
}

export function formatDateTime(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('vi-VN')
}

export function money(value) {
  const n = Number(value) || 0
  return n.toLocaleString('vi-VN') + ' đ'
}

export function statusBadge(status) {
  const map = {
    published: ['badge-success', 'Đã xuất bản'],
    draft: ['badge-warning', 'Bản nháp'],
    pending: ['badge-gold', 'Chờ duyệt'],
    rejected: ['badge-danger', 'Từ chối'],
    approved: ['badge-success', 'Đã duyệt'],
    active: ['badge-success', 'Đang hoạt động'],
    inactive: ['badge-secondary', 'Tắt'],
    new: ['badge-info', 'Mới'],
    in_progress: ['badge-gold', 'Đang xử lý'],
    resolved: ['badge-success', 'Đã xử lý'],
    con_hieu_luc: ['badge-success', 'Còn hiệu lực'],
    het_hieu_luc: ['badge-secondary', 'Hết hiệu lực']
  }
  if (status == null) return ['badge-secondary', '-']
  const s = String(status).toLowerCase()
  return map[s] || ['badge-secondary', status]
}