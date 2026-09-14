import React, { useState, useEffect } from 'react'
import { api, statusBadge, formatDateTime } from '../api.js'

export default function Feedback({ notify }) {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [detail, setDetail] = useState(null)
  const [reply, setReply] = useState('')
  const [status, setStatus] = useState('new')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api.feedback()
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch((e) => notify('error', e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openDetail = async (f) => {
    setDetail(f)
    setReply(f.response || '')
    setStatus(f.status || 'new')
  }

  const filtered = items.filter((f) => {
    if (filter !== 'all' && (f.status || '') !== filter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [f.sender_name, f.unit, f.title, f.content].join(' ').toLowerCase().includes(q)
  })

  const countBy = (s) => (s === 'all' ? items.length : items.filter((f) => (f.status || '') === s).length)

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateFeedback(detail.id, { status, response: reply, resolved_by: 'Admin' })
      notify('success', 'Đã lưu phản hồi')
      setDetail(null)
      load()
    } catch (e) { notify('error', e.message) } finally { setSaving(false) }
  }

  const handleDelete = async (f) => {
    if (!window.confirm('Xóa ý kiến góp ý này?')) return
    try { await api.deleteFeedback(f.id); notify('success', 'Đã xóa'); load() }
    catch (e) { notify('error', e.message) }
  }

  return (
    <div>
      <div className="grid-4">
        {[
          { icon: 'fa-envelope-open-text', cls: 'icon-blue', num: countBy('all'), lbl: 'Tổng góp ý' },
          { icon: 'fa-clock', cls: 'icon-gold', num: countBy('new'), lbl: 'Chưa xử lý' },
          { icon: 'fa-truck-fast', cls: 'icon-red', num: countBy('in_progress'), lbl: 'Đang xử lý' },
          { icon: 'fa-circle-check', cls: 'icon-green', num: countBy('resolved'), lbl: 'Đã xử lý' }
        ].map((c, i) => (
          <div className="stat-card" key={i}>
            <div className={`icon ${c.cls}`}><i className={`fa-solid ${c.icon}`}></i></div>
            <div><div className="num">{c.num}</div><div className="lbl">{c.lbl}</div></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head"><h2><i className="fa-solid fa-envelope-open-text me-2" style={{ color: '#2563EB' }}></i>Hòm thư góp ý — Đoàn viên gửi BCH</h2></div>
        <div className="card-body">
          <div className="filter-bar">
            <input type="search" placeholder="Tìm người gửi, đơn vị, tiêu đề…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'new', 'in_progress', 'resolved'].map((s) => (
                <button key={s} className={`btn btn-sm ${filter === s ? 'btn-navy' : 'btn-outline'}`} onClick={() => setFilter(s)}>
                  {s === 'all' ? 'Tất cả' : statusBadge(s)[1]} <span className="badge badge-secondary">{countBy(s)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Người gửi</th><th>Đơn vị</th><th>Chủ đề</th><th>Trạng thái</th><th>Thời gian</th><th style={{ width: 140 }}>Thao tác</th></tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id} style={{ background: (f.status || 'new') === 'new' ? '#F8FAFF' : undefined }}>
                    <td style={{ fontWeight: 600 }}>{f.sender_name}<div style={{ fontSize: 11, color: '#64748B' }}>{f.email || ''}</div></td>
                    <td className="text-secondary">{f.unit || '-'}</td>
                    <td style={{ maxWidth: 260 }}>
                      <div style={{ fontWeight: 600 }}>{f.title || f.subject || '-'}</div>
                      <div className="text-secondary" style={{ fontSize: 12 }}>{String(f.content || '').slice(0, 90)}…</div>
                    </td>
                    <td><span className={`badge ${statusBadge(f.status)[0]}`}>{statusBadge(f.status)[1]}</span></td>
                    <td className="text-secondary">{formatDateTime(f.submitted_at || f.submittedAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-sm btn-outline" onClick={() => openDetail(f)}><i className="fa-solid fa-reply me-1"></i>Phản hồi</button>
                        <button className="btn btn-sm btn-red" onClick={() => handleDelete(f)} title="Xóa"><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !filtered.length && <div className="empty"><i className="fa-solid fa-envelope-open"></i>Không có góp ý nào.</div>}
          </div>
        </div>
      </div>

      {detail && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setDetail(null)}>
          <div className="modal wide">
            <div className="modal-head">
              <h3><i className="fa-solid fa-reply me-2" style={{ color: '#2563EB' }}></i>Phản hồi: {detail.title || detail.subject}</h3>
              <button className="modal-close" onClick={() => setDetail(null)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 10, fontSize: 13, color: '#475569', marginBottom: 16, lineHeight: 1.8 }}>
                <strong>{detail.sender_name}</strong> — {detail.email || ''} · {detail.phone || ''} ({detail.unit || '-'})<br />
                Chủ đề: <strong>{detail.category || detail.topic || '-'}</strong> · {formatDateTime(detail.submitted_at || detail.submittedAt)}
                <div style={{ marginTop: 8, padding: '10px 12px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, whiteSpace: 'pre-wrap' }}>{detail.content}</div>
              </div>
              <div className="form-grid">
                <div className="form-field">
                  <label>Trạng thái xử lý</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="new">Mới</option>
                    <option value="in_progress">Đang xử lý</option>
                    <option value="resolved">Đã xử lý</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Người xử lý</label>
                  <input value={detail.resolved_by || 'Admin'} readOnly />
                </div>
                <div className="form-field full">
                  <label>Nội dung trả lời</label>
                  <textarea rows={5} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Cảm ơn bạn đã góp ý…" />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-outline" onClick={() => setDetail(null)}>Hủy</button>
                <button className="btn btn-blue" onClick={handleSave} disabled={saving}>
                  <i className="fa-solid fa-paper-plane me-1"></i>{saving ? 'Đang gửi…' : 'Gửi phản hồi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}