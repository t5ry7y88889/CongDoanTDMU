import React, { useState, useEffect } from 'react'
import { api, formatDateTime } from '../api.js'

const CHANNELS = [
  { id: 'web', label: 'Website', icon: 'fa-globe', badge: 'badge-info' },
  { id: 'facebook', label: 'Facebook', icon: 'fa-brands fa-facebook', badge: 'badge-info' },
  { id: 'zalo', label: 'Zalo OA', icon: 'fa-solid fa-comment-dots', badge: 'badge-secondary' }
]

const channelInfo = (id) => CHANNELS.find((c) => c.id === id) || CHANNELS[0]

const statusInfo = (status) => {
  switch (String(status || 'pending')) {
    case 'published': return ['badge-success', 'Đã xuất bản']
    case 'cancelled': return ['badge-secondary', 'Đã hủy']
    case 'failed': return ['badge-danger', 'Thất bại']
    default: return ['badge-gold', 'Chờ chạy lịch']
  }
}

export default function Schedule({ notify }) {
  const [schedules, setSchedules] = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ articleId: '', channel: 'web', scheduledAt: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([api.schedules(), api.articles()])
      .then(([s, a]) => {
        setSchedules(Array.isArray(s) ? s : [])
        setArticles(Array.isArray(a) ? a : a?.items || [])
      })
      .catch((e) => notify('error', e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const articleTitle = (s) => s.title || (articles.find((a) => String(a.id) === String(s.article_id || s.articleId))?.title) || `Bài viết #${s.article_id || s.articleId || '-'}`

  const createSchedule = async (e) => {
    e.preventDefault()
    if (!form.articleId || !form.channel || !form.scheduledAt) {
      notify('error', 'Vui lòng chọn đủ bài viết, kênh và thời gian lên lịch')
      return
    }
    setSaving(true)
    try {
      await api.post('/api/publish/schedule', {
        articleId: form.articleId,
        channel: form.channel,
        scheduledAt: new Date(form.scheduledAt).toISOString()
      })
      notify('success', 'Đã hẹn lịch xuất bản mới')
      setModal(false)
      load()
    } catch (err) {
      notify('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  const cancelSchedule = async (id) => {
    if (!window.confirm('Hủy lịch xuất bản này?')) return
    try {
      await api.del(`/api/publish/schedule/${id}`)
      notify('success', 'Đã hủy lịch xuất bản')
      load()
    } catch (err) {
      notify('error', err.message)
    }
  }

  const total = schedules.length
  const pendingCount = schedules.filter((s) => String(s.status || 'pending') === 'pending').length
  const publishedCount = schedules.filter((s) => String(s.status) === 'published').length

  const statCards = [
    { icon: 'fa-calendar-check', cls: 'icon-navy', num: total, lbl: 'Tổng lịch hẹn' },
    { icon: 'fa-hourglass-half', cls: 'icon-gold', num: pendingCount, lbl: 'Chờ chạy lịch' },
    { icon: 'fa-circle-check', cls: 'icon-green', num: publishedCount, lbl: 'Đã xuất bản' },
    { icon: 'fa-brands fa-facebook', cls: 'icon-blue', num: schedules.filter((s) => s.channel === 'facebook').length, lbl: 'Lịch Facebook' }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#003865', margin: '0 0 4px' }}>Lịch Xuất Bản Đa Kênh</h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Chủ động hẹn giờ phân phối bài viết lên Website, Facebook và Zalo OA</p>
        </div>
        <button className="btn btn-navy" onClick={() => setModal(true)}>
          <i className="fa-solid fa-plus me-1"></i>Thêm Lịch Đăng
        </button>
      </div>

      <div className="grid-4">
        {statCards.map((c, i) => (
          <div className="stat-card" key={i}>
            <div className={`icon ${c.cls}`}><i className={`fa-solid ${c.icon}`}></i></div>
            <div><div className="num">{c.num}</div><div className="lbl">{c.lbl}</div></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <h2><i className="fa-solid fa-calendar-plus me-2" style={{ color: '#7C3AED' }}></i>Danh sách lịch hẹn</h2>
          <span className="badge badge-info">{total} lịch</span>
        </div>
        <div className="card-body">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th><th>Bài viết</th><th>Kênh</th><th>Thời gian hẹn</th><th>Ngày tạo</th><th>Trạng thái</th><th style={{ textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => {
                  const ch = channelInfo(s.channel)
                  const [cls, label] = statusInfo(s.status)
                  return (
                    <tr key={s.id}>
                      <td className="text-secondary">#{s.id}</td>
                      <td style={{ fontWeight: 600, maxWidth: 320 }}>{articleTitle(s)}</td>
                      <td><span className={`badge ${ch.badge}`}><i className={`${ch.icon} me-1`}></i>{ch.label}</span></td>
                      <td className="text-secondary">{formatDateTime(s.scheduled_at || s.scheduledAt)}</td>
                      <td className="text-secondary">{formatDateTime(s.createdAt)}</td>
                      <td><span className={`badge ${cls}`}>{label}</span></td>
                      <td>
                        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                          {String(s.status || 'pending') === 'pending' && (
                            <button className="btn btn-sm btn-red" onClick={() => cancelSchedule(s.id)}>
                              <i className="fa-solid fa-ban me-1"></i>Hủy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!loading && !schedules.length && <div className="empty"><i className="fa-solid fa-calendar-check"></i>Chưa có lịch xuất bản nào. Bấm "Thêm Lịch Đăng" để lên lịch.</div>}
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-head">
              <h3><i className="fa-solid fa-calendar-plus me-2" style={{ color: '#7C3AED' }}></i>Thêm Lịch Xuất Bản</h3>
              <button className="modal-close" onClick={() => setModal(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form className="modal-body" onSubmit={createSchedule}>
              <div className="form-grid">
                <div className="form-field full">
                  <label>Bài viết (*)</label>
                  <select value={form.articleId} onChange={(e) => setForm((f) => ({ ...f, articleId: e.target.value }))}>
                    <option value="">— Chọn bài viết —</option>
                    {articles.map((a) => (
                      <option key={a.id} value={a.id}>{a.id}. {a.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Kênh phân phối (*)</label>
                  <select value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}>
                    {CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Thời gian hẹn (*)</label>
                  <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-navy" disabled={saving}>
                  <i className="fa-solid fa-floppy-disk me-1"></i>{saving ? 'Đang lưu…' : 'Lên lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}