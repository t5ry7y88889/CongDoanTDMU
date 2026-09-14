import React, { useState, useEffect, useRef, useCallback } from 'react'
import Dashboard from './views/Dashboard.jsx'
import Articles from './views/Articles.jsx'
import Studio from './views/Studio.jsx'
import Documents from './views/Documents.jsx'
import Welfare from './views/Welfare.jsx'
import Feedback from './views/Feedback.jsx'
import Reports from './views/Reports.jsx'
import Organization from './views/Organization.jsx'
import Comments from './views/Comments.jsx'
import Templates from './views/Templates.jsx'
import UsersView from './views/Users.jsx'

const NAV = [
  { group: 'Tổng quan', items: [{ id: 'dashboard', label: 'Bảng điều khiển', icon: 'fa-gauge-high' }] },
  {
    group: 'Nội dung & Truyền thông',
    items: [
      { id: 'articles', label: 'Quản lý bài viết', icon: 'fa-newspaper' },
      { id: 'studio', label: 'Studio sáng tạo', icon: 'fa-wand-magic-sparkles' },
      { id: 'documents', label: 'Văn bản', icon: 'fa-folder-open' },
      { id: 'templates', label: 'Mẫu/Nội dung mẫu', icon: 'fa-copy' }
    ]
  },
  {
    group: 'Công đoàn viên',
    items: [
      { id: 'welfare', label: 'Chăm lo & trợ cấp', icon: 'fa-heart' },
      { id: 'organization', label: 'Tổ chức & Nhân sự', icon: 'fa-users' },
      { id: 'users', label: 'Tài khoản', icon: 'fa-user-gear' }
    ]
  },
  {
    group: 'Phản hồi & Đánh giá',
    items: [
      { id: 'feedback', label: 'Góp ý & thư ngỏ', icon: 'fa-envelope-open-text' },
      { id: 'comments', label: 'Bình luận', icon: 'fa-comment-dots' },
      { id: 'reports', label: 'Báo cáo hoạt động', icon: 'fa-chart-simple' }
    ]
  }
]

const TITLES = {
  dashboard: ['Bảng điều khiển', 'Tổng quan hoạt động công đoàn TDMU'],
  articles: ['Quản lý bài viết', 'Duyệt, sửa & xuất bản tin tức, thông báo'],
  studio: ['Studio Sáng Tạo', 'Biên tập nội dung đa kênh với trợ lý AI'],
  documents: ['Quản lý văn bản', 'Đăng tải văn bản chỉ đạo, quy chế'],
  templates: ['Nội dung mẫu', 'Mẫu thông báo, QĐ, CV để tái sử dụng'],
  welfare: ['Chăm lo & trợ cấp', 'Chính sách chăm lo và hồ sơ trợ cấp'],
  organization: ['Tổ chức & Nhân sự', 'Cơ cấu Công đoàn & lực lượng đoàn viên'],
  users: ['Quản lý tài khoản', 'Tài khoản đăng nhập & phân quyền'],
  feedback: ['Góp ý & thư ngỏ', 'Hòm thư góp ý từ đoàn viên'],
  comments: ['Bình luận', 'Kiểm duyệt bình luận bài viết'],
  reports: ['Báo cáo hoạt động', 'Thu thập & xếp loại báo cáo các CĐCS']
}

function ToastStack({ toasts, dismiss }) {
  return (
    <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 500, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: '#fff', borderRadius: 11, boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            padding: '12px 16px', minWidth: 260, maxWidth: 360,
            borderLeft: `4px solid ${t.type === 'error' ? '#DC2626' : t.type === 'success' ? '#16A34A' : t.type === 'warn' ? '#F59E0B' : '#2563EB'}`,
            fontSize: 13.5, color: '#1E293B', cursor: 'pointer'
          }}
          onClick={() => dismiss(t.id)}
        >
          <strong style={{ display: 'block', marginBottom: 2 }}>{t.title}</strong>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

function SettingsModal({ open, onClose, settings, onSave, onTest }) {
  const [form, setForm] = useState(settings)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    if (open) { setForm(settings); setTestResult(null) }
  }, [open, settings])

  if (!open) return null

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try { await onSave(form); onClose() } finally { setSaving(false) }
  }

  const handleTest = async () => {
    setTestResult(null)
    try {
      const res = await onTest(form)
      setTestResult({ ok: true, msg: res.message || 'Kết nối thành công' })
    } catch (e) {
      setTestResult({ ok: false, msg: e.message })
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h3><i className="fa-solid fa-gear me-2" style={{ color: '#002855' }}></i>Cấu hình hệ thống</h3>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-field">
              <label>Cơ sở dữ liệu</label>
              <input value={form.mssqlHost || ''} placeholder="127.0.0.1" onChange={(e) => set('mssqlHost', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Port SQL</label>
              <input value={form.mssqlPort || ''} placeholder="1433" onChange={(e) => set('mssqlPort', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Tên database</label>
              <input value={form.mssqlDatabase || ''} placeholder="TDMU_TradeUnion_DB" onChange={(e) => set('mssqlDatabase', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Trạng thái</label>
              <select value={form.mssqlEnabled ? '1' : '0'} onChange={(e) => set('mssqlEnabled', e.target.value === '1')}>
                <option value="1">Bật (đọc/ghi SQL Server)</option>
                <option value="0">Tắt (dùng JSON fallback)</option>
              </select>
            </div>
            <div className="form-field">
              <label>AI: nhà cung cấp</label>
              <select value={form.aiProvider || 'openai'} onChange={(e) => set('aiProvider', e.target.value)}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="ollama">Ollama</option>
              </select>
            </div>
            <div className="form-field">
              <label>AI: model</label>
              <input value={form.aiModel || ''} placeholder="gpt-4o-mini" onChange={(e) => set('aiModel', e.target.value)} />
            </div>
            <div className="form-field">
              <label>AI: API key</label>
              <input type="password" value={form.aiApiKey || ''} placeholder="sk-…" onChange={(e) => set('aiApiKey', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Tên CSDL hiển thị</label>
              <input value={form.dbDisplayName || ''} placeholder="MSSQL TDMU" onChange={(e) => set('dbDisplayName', e.target.value)} />
            </div>
          </div>
          {testResult && (
            <div className="mt-3" style={{ marginTop: 12, fontSize: 13, padding: '10px 12px', borderRadius: 9, background: testResult.ok ? '#DCFCE7' : '#FEE2E2', color: testResult.ok ? '#166534' : '#991B1B' }}>
              <i className={`fa-solid ${testResult.ok ? 'fa-circle-check' : 'fa-triangle-exclamation'} me-2`}></i>{testResult.msg}
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn-outline" onClick={handleTest}><i className="fa-solid fa-plug me-1"></i>Kiểm tra kết nối</button>
            <button className="btn btn-outline" onClick={onClose}>Hủy</button>
            <button className="btn btn-gold" onClick={handleSave} disabled={saving}>
              <i className="fa-solid fa-save me-1"></i>{saving ? 'Đang lưu…' : 'Lưu cấu hình'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const LS_CONFIG_KEY = 'congdoan_admin_settings_v3'

async function req(url) {
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

function loadSettings() {
  const defaults = {
    mssqlHost: '127.0.0.1', mssqlPort: '1433', mssqlDatabase: 'TDMU_TradeUnion_DB',
    mssqlEnabled: true, aiProvider: 'openai', aiModel: 'gpt-4o-mini',
    aiApiKey: '', dbDisplayName: 'MSSQL TDMU'
  }
  try {
    const raw = localStorage.getItem(LS_CONFIG_KEY)
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
  } catch { return defaults }
}

export default function App() {
  const [active, setActive] = useState('dashboard')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState(loadSettings)
  const [connOk, setConnOk] = useState(false)
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  const toast = useCallback((type, title, msg) => {
    const id = ++toastId.current
    setToasts((ts) => [...ts, { id, type, title, msg }])
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 5200)
  }, [])

  const notify = useCallback((type, msg) => toast(type, type === 'error' ? 'Lỗi' : type === 'success' ? 'Thành công' : 'Thông báo', msg), [toast])

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((d) => setConnOk(Boolean(d && !d.error)))
      .catch(() => setConnOk(false))
  }, [])

  useEffect(() => {
    try { localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(settings)) } catch { /* noop */ }
  }, [settings])

  const openSection = (id) => {
    setActive(id)
    window.history.replaceState(null, '', `/admin#${id}`)
  }

  useEffect(() => {
    const hashSection = window.location.hash.replace('#', '')
    if (NAV.some((g) => g.items.some((it) => it.id === hashSection))) setActive(hashSection)
  }, [])

  async function saveSettings(form) {
    setSettings(form)
    await req('/api/dashboard')
    return { success: true }
  }

  async function testConnection(form) {
    const res = await fetch('/api/dashboard')
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    if (data && data.error) throw new Error(data.error)
    return { message: `Kết nối SQL Server thành công (${form.dbDisplayName || 'TDMU_TradeUnion_DB'}) — API sẵn sàng.` }
  }

  const title = TITLES[active] || TITLES.dashboard

  return (
    <div className="admin-flex">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-box">TĐ</div>
          <div>
            <div className="brand-name">Công Đoàn TDMU</div>
            <div className="brand-sub">Hệ thống quản trị</div>
          </div>
        </div>
        {NAV.map((group) => (
          <React.Fragment key={group.group}>
            <div className="nav-section">{group.group}</div>
            {group.items.map((item) => (
              <button key={item.id} className={`nav-link ${active === item.id ? 'active' : ''}`} onClick={() => openSection(item.id)}>
                <i className={`fa-solid ${item.icon}`}></i><span>{item.label}</span>
              </button>
            ))}
          </React.Fragment>
        ))}
        <div style={{ flex: 1 }} />
        <div className="nav-section" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
          Hệ thống
        </div>
        <button className="nav-link" onClick={() => setSettingsOpen(true)}>
          <i className="fa-solid fa-gear"></i><span>Cấu hình hệ thống</span>
        </button>
      </aside>

      <div className="admin-main">
        <header className="topbar">
          <div>
            <h1>{title[0]}</h1>
            <div className="sub">{title[1]}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="badge" style={{ background: connOk ? '#DCFCE7' : '#FEE2E2', color: connOk ? '#166534' : '#991B1B' }}>
              <span className={`stat-dot ${connOk ? 'dot-green' : 'dot-red'}`}></span>
              {connOk ? 'SQL Server' : 'Chưa kết nối'} · {settings.dbDisplayName || 'TDMU_TradeUnion_DB'}
            </span>
            <span className="badge badge-info" style={{ fontSize: 12, padding: '6px 12px' }}>
              <i className="fa-solid fa-user-shield me-1"></i>Admin
            </span>
          </div>
        </header>

        <main className="content">
          {active === 'dashboard' && <Dashboard notify={notify} />}
          {active === 'articles' && <Articles notify={notify} />}
          {active === 'studio' && <Studio notify={notify} />}
          {active === 'documents' && <Documents notify={notify} />}
          {active === 'templates' && <Templates notify={notify} />}
          {active === 'welfare' && <Welfare notify={notify} />}
          {active === 'organization' && <Organization notify={notify} />}
          {active === 'users' && <UsersView notify={notify} />}
          {active === 'feedback' && <Feedback notify={notify} />}
          {active === 'comments' && <Comments notify={notify} />}
          {active === 'reports' && <Reports notify={notify} />}
        </main>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={saveSettings}
        onTest={testConnection}
      />

      <ToastStack toasts={toasts} dismiss={(id) => setToasts((ts) => ts.filter((t) => t.id !== id))} />
    </div>
  )
}