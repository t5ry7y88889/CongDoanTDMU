import React, { useState, useEffect } from 'react'
import { api, formatDate } from '../api.js'

const emptyForm = { code: '', title: '', category: '', description: '', file_url: '' }

function formatSize(bytes) {
  const n = Number(bytes)
  if (!n) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1048576).toFixed(1)} MB`
}

function catLabel(category) {
  const map = {
    van_ban: 'Văn bản', bieu_mau: 'Biểu mẫu', de_cuong: 'Đề cương', bai_viet_mau: 'Bài viết mẫu',
    ke_hoach: 'Kế hoạch', cau_truc: 'Cấu trúc', khac: 'Khác'
  }
  return map[category] || category || 'Khác'
}

export default function Templates({ notify }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api.templates().then((d) => setTemplates(Array.isArray(d) ? d : []))
      .catch((e) => notify('error', e.message)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!form.title.trim()) { notify('warn', 'Vui lòng nhập tiêu đề mẫu'); return }
    setSaving(true)
    try {
      await api.createTemplate(form)
      notify('success', 'Đã tạo nội dung mẫu')
      setModalOpen(false); load()
    } catch (e) { notify('error', e.message) } finally { setSaving(false) }
  }

  const handleCopy = (t) => {
    const text = [t.title, t.description || ''].filter(Boolean).join('\n\n')
    navigator.clipboard?.writeText(text)
      .then(() => notify('success', 'Đã sao chép nội dung mẫu'))
      .catch(() => notify('warn', 'Không sao chép được'))
  }

  const handleDelete = async (t) => {
    if (!window.confirm(`Xóa mẫu “${t.title}” ?`)) return
    try { await api.deleteTemplate(t.id); notify('success', 'Đã xóa'); load() }
    catch (e) { notify('error', e.message) }
  }

  return (
    <div>
      <div className="card">
        <div className="card-head">
          <h2><i className="fa-solid fa-copy me-2" style={{ color: '#7C3AED' }}></i>Thư viện nội dung mẫu ({templates.length})</h2>
          <button className="btn btn-gold" onClick={() => setModalOpen(true)}><i className="fa-solid fa-plus"></i>Tạo mẫu mới</button>
        </div>
        <div className="card-body">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Mã</th><th>Tiêu đề</th><th>Loại</th><th>Mô tả</th><th>Kích cỡ</th><th>Ngày tạo</th><th style={{ width: 150 }}>Thao tác</th></tr></thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 700, color: '#7C3AED' }}>{t.code}</td>
                    <td style={{ fontWeight: 600, maxWidth: 260 }}><i className="fa-solid fa-file-invoice me-2 text-secondary"></i>{t.title}</td>
                    <td><span className="badge badge-gold">{catLabel(t.categoryName || t.category)}</span></td>
                    <td className="text-secondary" style={{ maxWidth: 260 }}>{String(t.description || '').slice(0, 90) || '-'}</td>
                    <td className="text-secondary">{formatSize(t.file_size)}</td>
                    <td className="text-secondary">{formatDate(t.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-sm btn-outline" onClick={() => setViewing(t)} title="Xem"><i className="fa-solid fa-eye"></i></button>
                        <button className="btn btn-sm btn-outline" onClick={() => handleCopy(t)} title="Dùng"><i className="fa-solid fa-copy"></i></button>
                        {t.file_url && <button className="btn btn-sm btn-outline" onClick={() => window.open(t.file_url, '_blank')} title="Tải về"><i className="fa-solid fa-download"></i></button>}
                        <button className="btn btn-sm btn-red" onClick={() => handleDelete(t)} title="Xóa"><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !templates.length && <div className="empty"><i className="fa-solid fa-copy"></i>Chưa có nội dung mẫu.</div>}
          </div>
        </div>
      </div>

      {viewing && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setViewing(null)}>
          <div className="modal">
            <div className="modal-head">
              <h3><i className="fa-solid fa-eye me-2" style={{ color: '#7C3AED' }}></i>{viewing.title}</h3>
              <button className="modal-close" onClick={() => setViewing(null)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <span className="badge badge-gold">{catLabel(viewing.categoryName || viewing.category)}</span>
                <span className="badge badge-secondary ms-1">{viewing.code}</span>
              </div>
              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: 10, whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.7, maxHeight: 320, overflow: 'auto' }}>
                {viewing.description || 'Không có chi tiết.'}
              </div>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => handleCopy(viewing)}><i className="fa-solid fa-copy me-1"></i>Sao chép</button>
                {viewing.file_url && <button className="btn btn-navy" onClick={() => window.open(viewing.file_url, '_blank')}><i className="fa-solid fa-download me-1"></i>Tải tệp</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-head">
              <h3><i className="fa-solid fa-plus me-2" style={{ color: '#7C3AED' }}></i>Tạo nội dung mẫu</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field"><label>Mã mẫu</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="BM-01/CĐ" /></div>
                <div className="form-field">
                  <label>Loại</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {['van_ban', 'bieu_mau', 'de_cuong', 'bai_viet_mau', 'ke_hoach', 'cau_truc', 'khac'].map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
                  </select>
                </div>
                <div className="form-field full"><label>Tiêu đề *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="form-field full"><label>Nội dung</label><textarea rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="form-field full"><label>Đường dẫn tệp đính kèm</label><input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="/uploads/templates/…" /></div>
              </div>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Hủy</button>
                <button className="btn btn-gold" onClick={handleCreate} disabled={saving}>
                  <i className="fa-solid fa-save me-1"></i>{saving ? 'Đang lưu…' : 'Tạo mẫu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}