import React, { useState, useEffect, useRef, useCallback } from 'react'
import Dashboard from './views/Dashboard.jsx'
import Articles from './views/Articles.jsx'
import Studio from './views/Studio.jsx'
import Documents from './views/Documents.jsx'
import Welfare from './views/Welfare.jsx'
import Feedback from './views/Feedback.jsx'
import Reports from './views/Reports.jsx'
import Templates from './views/Templates.jsx'
import UsersView from './views/Users.jsx'
import Schedule from './views/Schedule.jsx'
import Audits from './views/Audits.jsx'
import { api } from './api.js'

const NAV = [
  { group: 'TỔNG QUAN', items: [{ id: 'dashboard', label: 'Bảng Điều Hành', icon: 'fa-gauge-high', color: '#38BDF8', tooltip: 'Bảng Điều Hành' }] },
  {
    group: 'TRUYỀN THÔNG ĐA KÊNH',
    items: [
      { id: 'articles', label: 'Quản Lý Tin Tức', icon: 'fa-newspaper', color: '#60A5FA', tooltip: 'Quản Lý Tin Tức' },
      { id: 'ai-creator', label: 'Phòng Biên Tập Đa Kênh', icon: 'fa-wand-magic-sparkles', color: '#F59E0B', tooltip: 'Phòng Biên Tập Đa Kênh', badge: 'CMS' },
      { id: 'schedule', label: 'Lịch Xuất Bản', icon: 'fa-calendar-check', color: '#C084FC', tooltip: 'Lịch Xuất Bản' },
      { id: 'documents', label: 'Kho Văn Bản', icon: 'fa-folder-open', color: '#34D399', tooltip: 'Kho Văn Bản' },
      { id: 'templates', label: 'Kho Biểu Mẫu', icon: 'fa-file-word', color: '#0284C7', tooltip: 'Kho Biểu Mẫu', countKey: 'templates' }
    ]
  },
  {
    group: 'NGHIỆP VỤ CÔNG ĐOÀN',
    items: [
      { id: 'feedback', label: 'Hòm Thư Góp Ý', icon: 'fa-envelope-open-text', color: '#EC4899', tooltip: 'Hòm Thư Góp Ý', countKey: 'feedback' },
      { id: 'welfare', label: 'Quản Lý Trợ Cấp', icon: 'fa-hand-holding-heart', color: '#F59E0B', tooltip: 'Quản Lý Trợ Cấp', countKey: 'welfare' },
      { id: 'reports', label: 'Báo Cáo 16 Tổ CĐ', icon: 'fa-file-invoice', color: '#FBBF24', tooltip: 'Báo Cáo 16 Tổ CĐ' },
      { id: 'users', label: 'Cán Bộ & Phân Quyền', icon: 'fa-users-gear', color: '#F87171', tooltip: 'Cán Bộ & Phân Quyền' },
      { id: 'audits', label: 'Nhật Ký Tác Nghiệp', icon: 'fa-clock-rotate-left', color: '#A78BFA', tooltip: 'Nhật Ký Tác Nghiệp' }
    ]
  }
]

const TITLES = {
  dashboard: ['Bảng Điều Hành', 'Quản trị vòng đời nội dung truyền thông công đoàn TDMU'],
  articles: ['Quản Lý Tin Tức', 'Duyệt, sửa & xuất bản bài viết đa kênh'],
  'ai-creator': ['Phòng Biên Tập Đa Kênh', 'Tòa soạn AI — tiếp nhận tư liệu, lập bài báo gốc, phân phối đa kênh'],
  schedule: ['Lịch Xuất Bản', 'Hẹn giờ tự động xuất bản bài viết đa kênh'],
  documents: ['Kho Văn Bản', 'Đăng tải văn bản chỉ đạo, quy chế hoạt động'],
  templates: ['Kho Biểu Mẫu', 'Mẫu thông báo, QĐ, CV để tái sử dụng'],
  welfare: ['Quản Lý Trợ Cấp', 'Chính sách chăm lo & hồ sơ trợ cấp đoàn viên'],
  feedback: ['Hòm Thư Góp Ý', 'Ý kiến, phản ánh nguyện vọng từ đoàn viên'],
  reports: ['Báo Cáo 16 Tổ CĐ', 'Thu thập & xếp loại báo cáo các CĐCS'],
  users: ['Cán Bộ & Phân Quyền', 'Tài khoản đăng nhập & phân quyền'],
  audits: ['Nhật Ký Tác Nghiệp', 'Vết tác nghiệp toàn hệ thống tòa soạn']
}

function ToastStack({ toasts, dismiss }) {
  return (
    <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 1600, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: '#fff', borderRadius: 11, boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            padding: '12px 16px', minWidth: 260, maxWidth: 360,
            borderLeft: `4px solid ${t.type === 'error' ? '#EF4444' : t.type === 'success' ? '#10B981' : t.type === 'warn' ? '#D97706' : '#3B82F6'}`,
            fontSize: 13.5, color: '#0F172A', cursor: 'pointer'
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

  const AI_PROVIDERS = [
    { value: 'openai', label: 'ChatGPT (OpenAI)' },
    { value: 'gemini', label: 'Google Gemini' },
    { value: 'anthropic', label: 'Claude (Anthropic)' },
    { value: 'custom', label: 'Custom AI Model' }
  ]

  const MODEL_PLACEHOLDER = { openai: 'gpt-4o-mini', gemini: 'gemini-1.5-flash', anthropic: 'claude-3-5-sonnet', custom: 'my-model-name' }
  const DEFAULT_KEY_HINT = 'Bỏ trống để dùng API key từ .env trên server'

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
      <div className="modal wide">
        <div className="modal-head">
          <h3><i className="fa-solid fa-gear me-2" style={{ color: '#002855' }}></i>Cấu hình hệ thống</h3>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="modal-body">
          <h4 style={{ fontSize: 13, fontWeight: 800, color: '#002855', margin: '4px 0 10px' }}>CƠ SỞ DỮ LIỆU</h4>
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
              <label>Tên CSDL hiển thị</label>
              <input value={form.dbDisplayName || ''} placeholder="MSSQL TDMU" onChange={(e) => set('dbDisplayName', e.target.value)} />
            </div>
          </div>

          <h4 style={{ fontSize: 13, fontWeight: 800, color: '#002855', margin: '20px 0 10px' }}>TRÍ TUỆ NHÂN TẠO (AI)</h4>
          <div className="form-grid">
            <div className="form-field">
              <label>Nhà cung cấp AI</label>
              <select value={form.aiProvider || 'openai'} onChange={(e) => set('aiProvider', e.target.value)}>
                {AI_PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Model</label>
              <input value={form.aiModel || ''} placeholder={MODEL_PLACEHOLDER[form.aiProvider] || 'model-name'} onChange={(e) => set('aiModel', e.target.value)} />
            </div>
            <div className="form-field full">
              <label>API key</label>
              <input type="password" value={form.aiApiKey || ''} placeholder={DEFAULT_KEY_HINT} onChange={(e) => set('aiApiKey', e.target.value)} />
              <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>
                <i className="fa-solid fa-circle-info me-1"></i>
                Key lưu trên từng trình duyệt và gửi kèm mỗi lần gọi AI. Bỏ trống để server dùng key từ <code>.env</code> — nhớ khởi động lại server sau khi sửa <code>.env</code>.
              </div>
            </div>
            {form.aiProvider === 'custom' && (
              <div className="form-field full">
                <label>Endpoint (URL /v1/chat/completions)</label>
                <input value={form.aiEndpoint || ''} placeholder="https://api.example.com/v1/chat/completions" onChange={(e) => set('aiEndpoint', e.target.value)} />
              </div>
            )}
          </div>

          <h4 style={{ fontSize: 13, fontWeight: 800, color: '#002855', margin: '20px 0 10px' }}>KÊNH XUẤT BẢN ĐA KÊNH</h4>
          <div className="form-grid">
            <div className="form-field">
              <label>Facebook: Page ID</label>
              <input value={form.facebookPageId || ''} placeholder="Mã ID Fanpage (VD: 1234567890)" onChange={(e) => set('facebookPageId', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Facebook: Access Token</label>
              <input type="password" value={form.facebookAccessToken || ''} placeholder="EAAG…" onChange={(e) => set('facebookAccessToken', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Zalo OA: ID</label>
              <input value={form.zaloOaId || ''} placeholder="Mã OA (VD: 1234567890123456789)" onChange={(e) => set('zaloOaId', e.target.value)} />
            </div>
            <div className="form-field">
              <label>Zalo OA: Access Token</label>
              <input type="password" value={form.zaloAccessToken || ''} placeholder="Mã truy cập OA" onChange={(e) => set('zaloAccessToken', e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#64748B' }}>
            <i className="fa-solid fa-circle-info me-1"></i>
            Khi đã cấu hình token Facebook/Zalo, bấm "Xuất bản" trong Studio sẽ đăng thật lên kênh. Bỏ trống để mô phỏng kết quả.
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
    mssqlEnabled: true, aiProvider: 'gemini', aiModel: 'gemini-1.5-flash',
    aiApiKey: '', aiEndpoint: '', dbDisplayName: 'MSSQL TDMU',
    facebookPageId: '', facebookAccessToken: '', zaloOaId: '', zaloAccessToken: ''
  }
  try {
    const raw = localStorage.getItem(LS_CONFIG_KEY)
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
  } catch { return defaults }
}

export default function App() {
  const [active, setActive] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState(loadSettings)
  const [connOk, setConnOk] = useState(false)
  const [counts, setCounts] = useState({ templates: null, feedback: null, welfare: null })
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
    Promise.all([
      api.templates().then((r) => (Array.isArray(r) ? r.length : null)).catch(() => null),
      api.feedback().then((r) => (Array.isArray(r) ? r.length : null)).catch(() => null),
      api.welfareApplications().then((r) => (Array.isArray(r) ? r.length : null)).catch(() => null)
    ]).then(([t, f, w]) => setCounts({ templates: t, feedback: f, welfare: w }))
  }, [])

  useEffect(() => {
    try { localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(settings)) } catch { /* noop */ }
  }, [settings])

  const openSection = (id) => {
    setActive(id)
    if (window.location.pathname.endsWith('.html')) {
      document.querySelectorAll('.sidebar-nav-link').forEach((el) => el.classList.remove('active'))
      const el = document.getElementById(`menu_${id}`)
      if (el) el.classList.add('active')
    }
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
    <div className="admin-app-layout">
      <aside className={`admin-sidebar${collapsed ? ' collapsed' : ''}`} id="adminSidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
            <div className="logo-box" style={{ width: 40, height: 40, background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 0 1px rgba(255,255,255,0.18)' }}>
              <img src="/images/logo_cong_doan.png" alt="Công Đoàn TDMU" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="sidebar-brand-text">
              <span className="brand-title">CÔNG ĐOÀN TDMU</span>
              <span className="brand-sub">HỆ THỐNG TRUYỀN THÔNG ĐA KÊNH</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((group) => (
            <React.Fragment key={group.group}>
              <div className="nav-section-label">{group.group}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  id={`menu_${item.id}`}
                  className={`sidebar-nav-link ${active === item.id ? 'active' : ''}`}
                  data-tooltip={item.tooltip}
                  onClick={() => openSection(item.id)}
                >
                  <i className={`fa-solid ${item.icon} nav-icon`} style={{ color: item.color }}></i>
                  <span className="nav-text">{item.label}</span>
                  {item.badge && <span className="nav-badge-ai">{item.badge}</span>}
                  {item.countKey && Number.isFinite(counts[item.countKey]) && counts[item.countKey] > 0 && (
                    <span className="nav-count-badge">{counts[item.countKey]}</span>
                  )}
                </button>
              ))}
            </React.Fragment>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10.5, color: '#94A3B8' }}>Phiên bản v2.5 Enterprise</span>
            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>ONLINE</span>
          </div>
        </div>
      </aside>

      <div className="admin-main-wrapper">
        <header className="admin-top-header">
          <div className="header-left">
            <button type="button" className="btn-sidebar-toggle" onClick={() => setCollapsed((v) => !v)} title="Thu gọn / Mở rộng Menu">
              <i className="fa-solid fa-bars"></i>
            </button>
            <div className="header-breadcrumb">
              <span><i className="fa-solid fa-house-chimney me-1 text-muted"></i> Trang Quản Trị</span>
              <span className="text-muted">/</span>
              <strong>{title[0]}</strong>
            </div>
          </div>

          <div className="header-right">
            <span className="header-status-badge" style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
              <i className="fa-solid fa-bolt text-primary"></i> Cổng Tác Nghiệp Đa Kênh
            </span>

            <div className="user-profile-badge">
              <div className="user-avatar-circle">KU</div>
              <div className="user-meta">
                <div className="user-name" id="current_user_name">TS. Lê Thị Kim Út</div>
                <select className="role-switcher" defaultValue="admin" id="role_switcher" title="Vai trò">
                  <option value="admin">Quản Trị Viên (Admin)</option>
                  <option value="editor">Biên Tập Viên (Editor)</option>
                  <option value="contributor">Cộng Tác Viên (Contributor)</option>
                </select>
              </div>
            </div>

            <button type="button" className="btn-header-action" onClick={() => setSettingsOpen(true)} title="Cài đặt hệ thống tòa soạn">
              <i className="fa-solid fa-gear"></i>
            </button>

            <button
              type="button"
              className="btn-header-website"
              title="Xem Cổng thông tin trang chủ"
              onClick={() => window.open(`${window.location.origin}/`, '_blank')}
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i> Xem Website
            </button>
          </div>
        </header>

        <main className="admin-main">
          {active === 'dashboard' && <Dashboard notify={notify} goto={openSection} />}
          {active === 'articles' && <Articles notify={notify} />}
          {active === 'ai-creator' && <Studio notify={notify} />}
          {active === 'schedule' && <Schedule notify={notify} />}
          {active === 'documents' && <Documents notify={notify} />}
          {active === 'templates' && <Templates notify={notify} />}
          {active === 'welfare' && <Welfare notify={notify} />}
          {active === 'feedback' && <Feedback notify={notify} />}
          {active === 'reports' && <Reports notify={notify} />}
          {active === 'users' && <UsersView notify={notify} />}
          {active === 'audits' && <Audits notify={notify} />}
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