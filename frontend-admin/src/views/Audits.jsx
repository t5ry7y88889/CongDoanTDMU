import React, { useState, useEffect } from 'react'
import { api, formatDateTime } from '../api.js'

const normalize = (a) => ({
  id: a.id ?? a.MaKiemToan,
  articleId: a.articleId ?? a.MaBaiViet,
  actor: a.actor ?? a.username ?? a.userName ?? a.role ?? (a.MaNguoiDung != null ? `Người dùng #${a.MaNguoiDung}` : ''),
  action: a.action ?? a.HanhDong ?? '',
  detail: a.description ?? a.GhiChu ?? '',
  time: a.createdAt ?? a.ThoiGian ?? null
})

const actionBadge = (action) => {
  const s = String(action || '').toUpperCase()
  if (s.includes('PUBLISH') || s === 'XUAT_BAN' || s === 'XUẤT BẢN') return ['badge-success', 'Xuất bản']
  if (s.includes('CREATE') || s === 'TAO_MOI') return ['badge-info', 'Tạo mới']
  if (s.includes('UPDATE') || s.includes('EDIT') || s === 'SUA') return ['badge-gold', 'Chỉnh sửa']
  if (s.includes('DELETE') || s.includes('CANCEL') || s === 'XOA') return ['badge-danger', 'Xóa / Hủy']
  if (s.includes('APPROVE') || s === 'DUYET') return ['badge-gold', 'Phê duyệt']
  if (s.includes('REJECT')) return ['badge-danger', 'Từ chối']
  if (s.includes('SCHEDULE')) return ['badge-info', 'Lên lịch']
  return ['badge-secondary', action || '-']
}

export default function Audits({ notify }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const load = () => {
    setLoading(true)
    api.audits()
      .then((res) => {
        const arr = Array.isArray(res) ? res : res?.data || []
        setLogs(arr)
      })
      .catch((e) => notify('error', e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const rows = logs.map(normalize)
  const filtered = query
    ? rows.filter((r) => (r.action + ' ' + r.detail + ' ' + (r.actor || '')).toLowerCase().includes(query.toLowerCase()))
    : rows

  const byAction = (key) => rows.filter((r) => String(r.action || '').toUpperCase().includes(key)).length

  const statCards = [
    { icon: 'fa-clock-rotate-left', cls: 'icon-navy', num: rows.length, lbl: 'Tổng tác nghiệp' },
    { icon: 'fa-paper-plane', cls: 'icon-green', num: byAction('PUBLISH'), lbl: 'Lần xuất bản' },
    { icon: 'fa-pen', cls: 'icon-gold', num: byAction('UPDATE') + byAction('EDIT'), lbl: 'Lần chỉnh sửa' },
    { icon: 'fa-trash', cls: 'icon-red', num: byAction('DELETE') + byAction('CANCEL'), lbl: 'Xóa / Hủy' }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#003865', margin: '0 0 4px' }}>Nhật Ký Tác Nghiệp Hệ Thống</h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Vết hoạt động thao tác, duyệt và xuất bản nội dung trong tòa soạn</p>
        </div>
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <input type="search" placeholder="Tìm kiếm tác nghiệp..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="btn btn-outline" onClick={load}><i className="fa-solid fa-rotate-left me-1"></i>Làm mới</button>
        </div>
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
          <h2><i className="fa-solid fa-list-check me-2" style={{ color: '#8B5CF6' }}></i>Bảng tác nghiệp mới nhất</h2>
          <span className="badge badge-info">{filtered.length} bản ghi</span>
        </div>
        <div className="card-body">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th><th>Bài viết</th><th>Tác nhân</th><th>Thao tác</th><th>Chi tiết</th><th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const [cls, label] = actionBadge(r.action)
                  return (
                    <tr key={r.id ?? `${r.time}-${r.action}`}>
                      <td className="text-secondary">#{r.id ?? '-'}</td>
                      <td style={{ fontWeight: 600 }}>Bài viết #{r.articleId ?? '-'}</td>
                      <td>{r.actor || <span className="text-secondary">Hệ thống</span>}</td>
                      <td><span className={`badge ${cls}`}>{label}</span></td>
                      <td style={{ maxWidth: 380, fontWeight: 600 }}>{r.detail || '-'}</td>
                      <td className="text-secondary">{formatDateTime(r.time)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!loading && !filtered.length && (
              <div className="empty">
                <i className="fa-solid fa-clock-rotate-left"></i>
                {logs.length ? 'Không tìm thấy tác nghiệp phù hợp.' : 'Chưa có hoạt động tác nghiệp nào được ghi nhận.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}