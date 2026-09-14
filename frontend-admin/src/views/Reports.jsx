import React, { useState, useEffect } from 'react'
import { api, formatDate, money } from '../api.js'

export default function Reports({ notify }) {
  const [summary, setSummary] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([api.reportSummary(), api.reports()])
      .then(([s, r]) => {
        setSummary(s || null)
        setReports(Array.isArray(r) ? r : [])
      })
      .catch((e) => notify('error', e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = summary?.stats || {}
  const statCards = [
    { icon: 'fa-building', cls: 'icon-navy', num: stats.total_unions ?? 0, lbl: 'Tổng CĐCS' },
    { icon: 'fa-file-circle-check', cls: 'icon-green', num: stats.submitted_count ?? 0, lbl: 'Đã nộp báo cáo' },
    { icon: 'fa-hourglass-half', cls: 'icon-gold', num: stats.pending_count ?? 0, lbl: 'Chưa nộp' },
    { icon: 'fa-percent', cls: 'icon-blue', num: `${stats.submission_rate ?? 0}%`, lbl: 'Tỷ lệ nộp' },
    { icon: 'fa-hand-holding-heart', cls: 'icon-red', num: money(stats.total_care_fund ?? 0), lbl: 'Kinh phí chăm lo' },
    { icon: 'fa-users', cls: 'icon-green', num: Number(stats.total_members ?? 0).toLocaleString('vi-VN'), lbl: 'Đoàn viên' }
  ]

  const rankOf = (r) => {
    if ((r.status || '') === 'approved') return ['badge-success', 'Đã xếp loại']
    if ((r.status || '') === 'rejected') return ['badge-danger', 'Cần bổ sung']
    return ['badge-gold', 'Chờ xếp loại']
  }

  return (
    <div>
      <div className="grid-4">
        {statCards.map((c, i) => (
          <div className="stat-card" key={i}>
            <div className={`icon ${c.cls}`}><i className={`fa-solid ${c.icon}`}></i></div>
            <div><div className="num" style={{ fontSize: 19 }}>{c.num}</div><div className="lbl">{c.lbl}</div></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <h2><i className="fa-solid fa-chart-simple me-2" style={{ color: '#F59E0B' }}></i>Bảng xếp loại — Tháng {summary?.month ?? '-'}/{summary?.year ?? '-'}</h2>
          <span className="badge badge-info">{summary?.data?.length ?? 0} tổ công đoàn</span>
        </div>
        <div className="card-body">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>STT</th><th>Tổ công đoàn</th><th>Người báo cáo</th><th>Số đoàn viên</th><th>Nữ đoàn viên</th>
                  <th>Chăm lo (đ)</th><th>Tuyên truyền</th><th>Kết nạp mới</th><th>Điểm</th><th>Xếp loại</th><th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {(summary?.data || []).map((s, i) => (
                  <tr key={s.union_id ?? i}>
                    <td className="text-secondary">{s.stt ?? i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{s.union_name}</td>
                    <td>{s.has_submitted ? (s.reporter_name || '-') : <span className="badge badge-secondary">Chưa nộp</span>}</td>
                    <td>{Number(s.total_members ?? 0).toLocaleString('vi-VN')}</td>
                    <td>{Number(s.female_members ?? 0).toLocaleString('vi-VN')}</td>
                    <td style={{ fontWeight: 700, color: '#16A34A' }}>{money(s.care_fund ?? 0)}</td>
                    <td>{s.propaganda_sessions ?? 0}</td>
                    <td>{s.party_introduced ?? 0}</td>
                    <td style={{ fontWeight: 700 }}>{s.evaluation_score ?? 0}</td>
                    <td><span className={s.evaluation_rank?.includes('Xuất Sắc') ? 'badge badge-gold' : 'badge badge-info'}>{s.evaluation_rank || '-'}</span></td>
                    <td>
                      {s.proof_url
                        ? <a className="badge badge-info" href={s.proof_url} target="_blank" rel="noreferrer"><i className="fa-solid fa-link me-1"></i>Minh chứng</a>
                        : <span className="text-secondary">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !summary?.data?.length && <div className="empty"><i className="fa-solid fa-chart-simple"></i>Chưa có dữ liệu báo cáo.</div>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head"><h2><i className="fa-solid fa-list-ul me-2" style={{ color: '#2563EB' }}></i>Chi tiết báo cáo các CĐCS</h2></div>
        <div className="card-body">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Tên tổ</th><th>Báo cáo</th><th>Trạng thái</th><th>Đánh giá tự nhận</th><th>Rút kinh nghiệm</th></tr>
              </thead>
              <tbody>
                {reports.map((r) => {
                  const [cls, label] = rankOf(r)
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.unit_name || r.union_name}</td>
                      <td className="text-secondary">Tháng {r.month}/{r.year}</td>
                      <td><span className={`badge ${cls}`}>{label}</span><div style={{ fontSize: 11 }}>{r.submittedAt || formatDate(r.submitted_at)}</div></td>
                      <td>{r.self_assessment || '-'}</td>
                      <td style={{ maxWidth: 260 }} className="text-secondary">{String(r.recommendations || '').slice(0, 100) || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!loading && !reports.length && <div className="empty"><i className="fa-solid fa-list-ul"></i>Không có báo cáo chi tiết.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}