import React, { useState, useEffect } from 'react';

export default function QuanLyLichXuatBan({ onGoToEditor }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/publish/schedules').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setSchedules(res.data);
      }
    } catch (e) {
      console.error('Lỗi nạp lịch xuất bản:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch xuất bản này không?')) return;
    try {
      const res = await fetch(`/api/publish/schedule/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        alert('Đã hủy lịch xuất bản thành công!');
        loadSchedules();
      } else {
        alert(res.message || 'Không thể hủy lịch!');
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ!');
    }
  };

  return (
    <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', background: '#F8FAFC' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#002855', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-calendar-check" style={{ color: '#A855F7' }} />
            <span>Lịch Xuất Bản & Hàng Đợi Phân Phối Đa Kênh</span>
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
            Quản lý các tin bài được hẹn giờ phát hành tự động lên Cổng Thông Tin Web, Mạng xã hội Facebook Fanpage và Zalo OA
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadSchedules}
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
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-rotate-right" />
            <span>Làm mới</span>
          </button>
          {onGoToEditor && (
            <button
              onClick={onGoToEditor}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: '700',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(2,132,199,0.3)'
              }}
            >
              <i className="fa-solid fa-plus" />
              <span>Lập lịch bài mới</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
          <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ marginBottom: '12px' }} />
          <div>Đang nạp danh sách lịch hẹn phát hành...</div>
        </div>
      ) : schedules.length === 0 ? (
        <div style={{ background: 'white', border: '1px dashed #CBD5E1', borderRadius: '12px', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F1F5F9', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>
            <i className="fa-regular fa-calendar-xmark" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: '0 0 8px' }}>Hiện không có bài viết nào trong hàng đợi hẹn giờ</h3>
          <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '420px', margin: '0 auto 20px' }}>
            Khi soạn thảo tin bài, bạn có thể chọn tab "⏰ Hẹn Lịch" để đặt thời gian phát hành tự động mà không cần can thiệp thủ công.
          </p>
          {onGoToEditor && (
            <button
              onClick={onGoToEditor}
              style={{
                background: '#0284C7',
                color: 'white',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Mở Trình Soạn Thảo Tin Bài
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {schedules.map(sch => {
            const isPast = new Date(sch.scheduledAt) < new Date();
            return (
              <div
                key={sch.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: isPast ? '#FEF3C7' : '#DCFCE7',
                      color: isPast ? '#92400E' : '#166534',
                      border: `1px solid ${isPast ? '#FCD34D' : '#86EFAC'}`
                    }}>
                      {isPast ? 'ĐANG XỬ LÝ / CHỜ TRIGGER' : 'SẮP PHÁT HÀNH'}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#0284C7' }}>
                      ⏰ {new Date(sch.scheduledAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    {sch.title || 'Bài viết chưa đặt tiêu đề'}
                  </h3>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {(sch.channels || []).map(ch => (
                      <span
                        key={ch}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: ch === 'facebook' ? '#1877F215' : ch === 'zalo' ? '#0068FF15' : '#0284C715',
                          color: ch === 'facebook' ? '#1877F2' : ch === 'zalo' ? '#0068FF' : '#0284C7',
                          fontWeight: '600',
                          border: `1px solid ${ch === 'facebook' ? '#1877F240' : ch === 'zalo' ? '#0068FF40' : '#0284C740'}`
                        }}
                      >
                        {ch === 'facebook' ? '📘 Facebook' : ch === 'zalo' ? '💬 Zalo OA' : '🌐 Cổng TTDT'}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                  <button
                    onClick={() => handleCancel(sch.id)}
                    style={{
                      background: '#FEE2E2',
                      color: '#991B1B',
                      border: '1px solid #FCA5A5',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fa-solid fa-trash me-1" /> Hủy Lịch
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
