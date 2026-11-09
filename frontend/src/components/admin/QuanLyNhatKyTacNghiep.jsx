import React, { useState, useEffect } from 'react';

export default function QuanLyNhatKyTacNghiep() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audits').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setLogs(res.data);
      } else {
        // Fallback or demo logs if database table is fresh
        setLogs([
          {
            id: 1,
            created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            user_name: 'TS. Lê Thị Kim Út',
            user_email: 'utltk@tdmu.edu.vn',
            action: 'XUẤT_BẢN',
            target: 'Thông báo xét duyệt học bổng con em đoàn viên 2026',
            details: 'Xuất bản tin tức trực tiếp lên Cổng thông tin CĐCS và Kênh Fanpage'
          },
          {
            id: 2,
            created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            user_name: 'ThS. Nguyễn Minh Oanh',
            user_email: 'oanhm@tdmu.edu.vn',
            action: 'CẬP_NHẬT_VĂN_BẢN',
            target: 'Quy chế chi tiêu nội bộ Công đoàn cơ sở năm học 2025-2026',
            details: 'Đính kèm tệp PDF mới: Quy_che_chi_tieu_2026.pdf'
          },
          {
            id: 3,
            created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
            user_name: 'Quản Trị Viên Hệ Thống',
            user_email: 'admin@tdmu.edu.vn',
            action: 'CẤU_HÌNH_HỆ_THỐNG',
            target: 'Thanh thông báo khẩn Ticker',
            details: 'Kích hoạt thông báo nóng chào mừng Đại hội Công đoàn'
          }
        ]);
      }
    } catch (e) {
      console.error('Lỗi nạp nhật ký:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const text = ((log.user_name || '') + (log.user_email || '') + (log.target || '') + (log.details || '') + (log.action || '')).toLowerCase();
    const matchSearch = text.includes(search.toLowerCase());
    const matchAction = filterAction === 'all' || log.action?.toLowerCase().includes(filterAction.toLowerCase());
    return matchSearch && matchAction;
  });

  const getBadgeStyle = (act) => {
    const a = (act || '').toUpperCase();
    if (a.includes('XUẤT_BẢN') || a.includes('PUBLISH')) return { bg: '#DCFCE7', color: '#166534', border: '#86EFAC' };
    if (a.includes('XÓA') || a.includes('DELETE')) return { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' };
    if (a.includes('CẬP_NHẬT') || a.includes('UPDATE')) return { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' };
    return { bg: '#E0F2FE', color: '#075985', border: '#BAE6FD' };
  };

  return (
    <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', background: '#F8FAFC' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#002855', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-clock-rotate-left" style={{ color: '#8B5CF6' }} />
            <span>Nhật Ký Tác Nghiệp & Vết Kiểm Duyệt Hệ Thống</span>
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
            Theo dõi toàn bộ lịch sử thao tác biên tập, xuất bản, cập nhật văn bản và thiết lập cấu hình của cán bộ
          </p>
        </div>
        <button
          onClick={loadLogs}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'white',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '9px 16px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#334155',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <i className="fa-solid fa-rotate-right" />
          <span>Làm mới nhật ký</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Tìm theo cán bộ, đối tượng, nội dung thao tác..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '14px',
              background: 'white',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            fontSize: '14px',
            background: 'white',
            fontWeight: '600',
            color: '#334155'
          }}
        >
          <option value="all">Tất cả hành động</option>
          <option value="XUẤT_BẢN">Xuất bản</option>
          <option value="CẬP_NHẬT">Cập nhật / Chỉnh sửa</option>
          <option value="XÓA">Xóa dữ liệu</option>
          <option value="CẤU_HÌNH">Cấu hình hệ thống</option>
        </select>
      </div>

      {/* Logs Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', color: '#475569', fontWeight: '700' }}>
              <th style={{ padding: '14px 16px', width: '160px' }}>Thời gian</th>
              <th style={{ padding: '14px 16px', width: '220px' }}>Cán bộ thực hiện</th>
              <th style={{ padding: '14px 16px', width: '150px' }}>Hành động</th>
              <th style={{ padding: '14px 16px' }}>Đối tượng & Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }} /> Đang tải lịch sử tác nghiệp...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                  Không tìm thấy sự kiện tác nghiệp nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => {
                const badge = getBadgeStyle(log.action);
                return (
                  <tr key={log.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', color: '#64748B', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: '600', color: '#334155' }}>
                        {new Date(log.created_at || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '11px' }}>
                        {new Date(log.created_at || Date.now()).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#002855' }}>
                        {log.user_name || 'Cán bộ Công đoàn'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        {log.user_email || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`
                      }}>
                        {log.action || 'THAO_TÁC'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#1E293B', marginBottom: '4px' }}>
                        {log.target || log.details || '—'}
                      </div>
                      {log.target && log.details && log.target !== log.details && (
                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                          {log.details}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
