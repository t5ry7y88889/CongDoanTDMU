import React, { useState, useEffect } from 'react'
import { api } from '../api.js'

export default function Organization({ notify }) {
  const [tree, setTree] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.orgData()
      .then(setTree)
      .catch((e) => notify('error', e.message))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const boards = tree?.boards || []
  const units = tree?.units || []
  const cadres = tree?.cadres || []
  const stats = tree?.stats || {}

  const unitName = (id) => {
    const u = units.find((x) => String(x.id) === String(id))
    return u ? u.name || u.code : '-'
  }

  const boardName = (id) => {
    const b = boards.find((x) => String(x.id) === String(id))
    return b ? b.name : '-'
  }

  return (
    <div>
      <div className="grid-4">
        {[
          { icon: 'fa-building', cls: 'icon-navy', num: stats.total_boards ?? boards.length, lbl: 'Ban chuyên môn' },
          { icon: 'fa-people-group', cls: 'icon-gold', num: stats.total_units ?? units.length, lbl: 'Tổ Công đoàn' },
          { icon: 'fa-user-tie', cls: 'icon-green', num: stats.total_cadres ?? cadres.length, lbl: 'Cán bộ' },
          { icon: 'fa-users', cls: 'icon-blue', num: Number(stats.total_members ?? 0).toLocaleString('vi-VN'), lbl: 'Đoàn viên' }
        ].map((c, i) => (
          <div className="stat-card" key={i}>
            <div className={`icon ${c.cls}`}><i className={`fa-solid ${c.icon}`}></i></div>
            <div><div className="num">{c.num}</div><div className="lbl">{c.lbl}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
        <div className="card">
          <div className="card-head"><h2><i className="fa-solid fa-building me-2" style={{ color: '#002855' }}></i>Ban chuyên môn ({boards.length})</h2></div>
          <div className="card-body">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Tên ban</th><th>Nhiệm kỳ</th><th>Mô tả</th></tr></thead>
                <tbody>
                  {boards.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600 }}>{b.name}</td>
                      <td className="text-secondary">{b.tenure || '-'}</td>
                      <td className="text-secondary" style={{ maxWidth: 240 }}>{String(b.description || '').slice(0, 80) || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && !boards.length && <div className="empty"><i className="fa-solid fa-building"></i>Chưa có dữ liệu.</div>}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h2><i className="fa-solid fa-people-group me-2" style={{ color: '#F59E0B' }}></i>Tổ Công đoàn ({units.length})</h2></div>
          <div className="card-body">
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Mã</th><th>Tên</th><th>Tổ trưởng</th><th>Email</th></tr></thead>
                <tbody>
                  {units.map((u) => (
                    <tr key={u.id}>
                      <td className="text-secondary">{u.code}</td>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td>{u.leader || '-'}</td>
                      <td className="text-secondary">{u.email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && !units.length && <div className="empty"><i className="fa-solid fa-people-group"></i>Chưa có dữ liệu.</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h2><i className="fa-solid fa-user-tie me-2" style={{ color: '#16A34A' }}></i>Đội ngũ cán bộ / nhân sự ({cadres.length})</h2></div>
        <div className="card-body">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Mã số</th><th>Họ tên</th><th>Ban chuyên môn</th><th>Tổ Công đoàn</th><th>Chức vụ</th><th>Email</th></tr></thead>
              <tbody>
                {cadres.map((c) => (
                  <tr key={c.id}>
                    <td className="text-secondary">{c.code}</td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{boardName(c.board_id)}</td>
                    <td>{unitName(c.unit_id)}</td>
                    <td><span className="badge badge-gold">{c.role || '-'}</span></td>
                    <td className="text-secondary">{c.email || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !cadres.length && <div className="empty"><i className="fa-solid fa-user-tie"></i>Chưa có dữ liệu.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}